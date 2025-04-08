---
title: Protocolo Interledger®
---

> Habilita el intercambio fluido de valor entre redes de pago

El Protocolo Interledger (ILP) es un conjunto de protocolos abiertos para enviar paquetes de valor a través de diferentes redes de pago. Al igual que internet, los conectores enrutan paquetes de dinero entre redes independientes. Su arquitectura abierta y protocolo mínimo permiten la interoperabilidad entre sistemas de transferencia de valor.

**Interledger no está vinculado a una sola empresa, red de pago o moneda.**

<div class="overview-grid">
  <div class="overview-item">
    <img src="/developers/img/routing.svg" alt="">
    <div>
      <p><strong>Enrutamiento de múltiples saltos</strong></p>
      <p>Envía pagos a otras ASEs en la red, incluso si están a varios saltos de distancia.</p>
    </div>
  </div>
  <div class="overview-item">
    <img src="/developers/img/protocol.svg" alt="">
    <div>
      <p><strong>Protocolo simple</strong></p>
      <p>Inspirado en TCP/IP, Interledger es fácil de implementar y usar.</p>
    </div>
  </div>
  <div class="overview-item">
    <img src="/developers/img/code.svg" alt="">
    <div>
      <p><strong>Abierto y extensible</strong></p>
      <p>Extiende o adapta tu implementación para satisfacer tus necesidades específicas.</p>
    </div>
  </div>
</div>

Las redes de pago tradicionales operan de forma independiente entre sí. Enviar valor es fácil solo si el emisor y el receptor tienen cuentas en la misma red, pero puede ser lento y costoso si están en redes distintas. Interledger facilita las transacciones en cualquier moneda o red de pago que elijas, porque no está atado a ninguna empresa, red ni moneda. Usando Interledger, puedes enviar AUD a alguien que quiere recibir GBP, o USD a alguien que desea recibir EUR.

## ¿Qué es Interledger?

Interledger es una red de computadoras que permite enviar valor a través de redes de pago independientes. Similar a cómo internet enruta paquetes de información, Interledger enruta paquetes de valor. Las computadoras en la red Interledger se llaman *nodos*. Los nodos pueden asumir uno o más de los siguientes roles:

- Remitente – Inicia una transferencia de valor.
- Conector – Aplica el cambio de moneda y reenvía paquetes de valor. Es un nodo intermediario entre el remitente y el receptor.
- Receptor – Recibe el valor.

![Nodos ILP](/developers/img/ilp-nodes.svg)

**Nota:** Los términos *Conector* y *Enrutador* se usan indistintamente en la documentación.

## ¿Cómo funciona Interledger?

En el núcleo de Interledger se encuentra el [Protocolo Interledger (ILPv4)](https://interledger.org/developers/rfcs/interledger-protocol/), un conjunto de reglas que define cómo deben enviar valor los nodos a través de la red Interledger. ILPv4 es un protocolo de *solicitud/respuesta*, donde las solicitudes y respuestas son paquetes ILPv4. Normalmente, un único pago agregado desde el origen hasta el destino se divide en varios paquetes ILP. Cada paquete contiene información de la transacción, que es privada entre los nodos que participan. ILPv4 tiene tres tipos de paquetes: *Prepare*, *Fulfill* y *Reject*.

![Paquetes ILP](/developers/img/ilp-packets.svg)

El remitente construye y envía un paquete Prepare como solicitud al conector. Los conectores reenvían el paquete hasta que llega al receptor. Luego, el receptor acepta o rechaza el paquete enviando un paquete Fulfill o Reject como respuesta. Los conectores retransmiten la respuesta del receptor de vuelta al remitente. Cuando el remitente recibe un paquete Fulfill, sabe que el paquete fue entregado exitosamente. Entonces continúa enviando los paquetes Prepare restantes hasta que se transfiere todo el valor.

Interledger no depende de ninguna red de pago específica para procesar transacciones de valor. Puedes conectarte a un conector ILPv4 en cualquier momento para unirte a la red. Además, Interledger envía valor en pequeños paquetes de datos, lo que hace que las transacciones sean rápidas, seguras y económicas.

Para un análisis más profundo de cómo funciona ILPv4, consulta [Flujo ILPv4](https://interledger.org/developers/rfcs/interledger-protocol#prerequisites).

## Crear sobre Interledger

Incorpora pagos en tus aplicaciones u otros protocolos sin atarte a una moneda o red de pago específica. Crea cuentas en nuestros ledgers de demostración y comienza a enviar pagos Interledger con las bibliotecas cliente.

## Arquitectura de Interledger

Interledger permite pagos a través de muchos tipos diferentes de libros contables. El conjunto de protocolos Interledger se compone de cuatro capas: las capas de Aplicación, Transporte, Interledger y Enlace. Para más información, consulta la [Visión General de la Arquitectura](https://interledger.org/developers/rfcs/interledger-architecture).

## Especificaciones y APIs del protocolo

Para explorar las especificaciones técnicas, consulta los [Interledger RFCs](https://github.com/interledger/rfcs). También consulta la documentación de los componentes de la implementación de referencia.

## Seguridad

Interledger permite pagos seguros de múltiples saltos utilizando [Acuerdos de Bloqueo Temporal con Hash](https://interledger.org/developers/rfcs/hashed-timelock-agreements). A partir de Interledger v4, estas condiciones no son impuestas por el libro contable, ya que sería demasiado costoso y lento. En su lugar, los participantes de la red usan estos hashlocks para llevar la contabilidad entre pares. Esta contabilidad se utiliza para determinar los saldos en tránsito, que se liquidan periódicamente con transferencias en el libro contable o reclamos en canales de pago. Para una descripción detallada de cómo funciona esto, consulta la documentación sobre [Emparejamiento, Compensación y Liquidación](https://interledger.org/developers/rfcs/peering-clearing-settling/).
