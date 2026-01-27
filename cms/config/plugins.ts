export default () => ({
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
