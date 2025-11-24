const PAGE_TITLE_ID = "_top";

export class StarlightTOC extends HTMLElement {
  private _current = this.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
  private minH = parseInt(this.dataset.minH || "2", 10);
  private maxH = parseInt(this.dataset.maxH || "3", 10);

  protected set current(link: HTMLAnchorElement) {
    if (link === this._current) return;
    if (this._current) this._current.removeAttribute("aria-current");
    link.setAttribute("aria-current", "true");
    this._current = link;
  }

  private onIdle = (cb: IdleRequestCallback) =>
    (window.requestIdleCallback || ((cb) => setTimeout(cb, 1)))(cb);

  constructor() {
    super();
    this.onIdle(() => this.init());
  }

  private init = (): void => {
    const links = [...this.querySelectorAll("a")];

    const isHeading = (el: Element): el is HTMLHeadingElement => {
      if (el instanceof HTMLHeadingElement) {
        if (el.id === PAGE_TITLE_ID) return true;
        const level = el.tagName[1];
        if (level) {
          const int = parseInt(level, 10);
          if (int >= this.minH && int <= this.maxH) return true;
        }
      }
      return false;
    };

    const getElementHeading = (el: Element | null): HTMLHeadingElement | null => {
      if (!el) return null;
      const origin = el;
      while (el) {
        if (isHeading(el)) return el;
        el = el.previousElementSibling;
        while (el?.lastElementChild) {
          el = el.lastElementChild;
        }
        const h = getElementHeading(el);
        if (h) return h;
      }
      return getElementHeading(origin.parentElement);
    };

    const setCurrent: IntersectionObserverCallback = (entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        const heading = getElementHeading(target);
        if (!heading) continue;
        const link = links.find((link) => link.hash === "#" + encodeURIComponent(heading.id));
        if (link) {
          this.current = link;
          break;
        }
      }
    };

    const toObserve = document.querySelectorAll("main [id], main [id] ~ *, main .content > *");

    let observer: IntersectionObserver | undefined;
    const observe = () => {
      if (observer) return;
      observer = new IntersectionObserver(setCurrent, { rootMargin: this.getRootMargin() });
      toObserve.forEach((h) => observer!.observe(h));
    };
    observe();

    let timeout: ReturnType<typeof setTimeout>;
    window.addEventListener("resize", () => {
      if (observer) {
        observer.disconnect();
        observer = undefined;
      }
      clearTimeout(timeout);
      timeout = setTimeout(() => this.onIdle(observe), 200);
    });
  };

  private getRootMargin(): `-${number}px 0% ${number}px` {
    const navBarHeight = document.querySelector("header")?.getBoundingClientRect().height || 0;
    const mobileTocHeight = this.querySelector("summary")?.getBoundingClientRect().height || 0;
    const top = navBarHeight + mobileTocHeight + 32;
    const bottom = top + 53;
    const height = document.documentElement.clientHeight;
    return `-${top}px 0% ${bottom - height}px`;
  }
}

customElements.define("starlight-toc", StarlightTOC);

