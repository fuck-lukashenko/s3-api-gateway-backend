class Response {
  #headers;
  #onSend;
  #status;

  constructor(onSend) {
    this.#onSend = onSend;
  }

  set status(value) {
    this.#status = value;
  }

  set headers(value) {
    this.#headers = value;
  }

  async send(data) {
    await this.#onSend({
      status: this.#status,
      headers: this.#headers,
      data,
    })
  }
}

export default Response;
