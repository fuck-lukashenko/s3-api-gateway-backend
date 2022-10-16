class Client {
  static all() {
    return JSON.parse(process.env.CLIENTS).map(({ godmode, ...c }) => {
      if (godmode) {
        return new GodModeClient(c);
      } else {
        return new Client(c);
      }
    });
  }

  static find(id) {
    const result = Client.all().find((c) => c.id === id);

    if (!result) {
      throw `Couldn't find a Client with id ${id}.`;
    }

    if (result.proxy == null) {
      result.proxy = true;
    }

    return result;
  }

  constructor({ id, base_url: baseURL, proxy }) {
    this.id = id;
    this.baseURL = baseURL;
    this.proxy = proxy;
  }

  urlFor(endpoint) {
    const urlCandidate = new URL(endpoint, this.baseURL);

    return urlCandidate.href.replace(urlCandidate.origin, new URL(this.baseURL).origin);
  }
}

class GodModeClient extends Client {
  urlFor(endpoint) {
    return endpoint;
  }
}

export default Client;
