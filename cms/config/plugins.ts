export default () => ({
  i18n: {
    enabled: true
  },
  ckeditor: {
    enabled: true
  },
  'record-locking': {
    enabled: true,
    config: {
      showTakeoverButton: true,
      transports: ['websocket']
    }
  }
})
