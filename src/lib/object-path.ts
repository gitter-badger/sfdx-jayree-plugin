import * as objectPath from 'object-path';

// tslint:disable-next-line: no-any
(Array.prototype as any).equals = function (arr) {
  return this.length === arr.length && this.every((u, i) => u === arr[i]);
};

function compareobj(obj1, obj2) {
  // tslint:disable-next-line: no-any
  return ((!Array.isArray(obj2) ? [obj2] : obj2) as any).equals(!Array.isArray(obj1) ? [obj1] : obj1);
}

interface QueryParameters {
  path;
  key?;
  value?;
}

class ObjectPathResolver {
  _path = '';
  _object = '';

  constructor(object) {
    this._object = object;
  }

  value() {
    return this._path;
  }

  resolve({ path, key, value }: QueryParameters) {
    if (this._path !== '') {
      if (Array.isArray(objectPath.get(this._object, this._path))) {
        if (objectPath.get(this._object, this._path).length === 1) {
          this._path = this._path + '.0.' + path;
        }
      } else {
        this._path = this._path + '.' + path;
      }
    } else {
      this._path = path;
    }
    if (objectPath.get(this._object, this._path)) {
      if (value) {
        let matchingPath = '';
        if (key === undefined) {
          if (compareobj(objectPath.get(this._object, this._path), value)) {
            return this;
          }
        }
        for (let i = 0; i < objectPath.get(this._object, this._path).length; i++) {
          let iOrKeyPath = '';
          if (key === undefined) {
            iOrKeyPath = `${this._path}.${i}`;
          } else {
            iOrKeyPath = `${this._path}.${i}.${key}`;
          }
          if (compareobj(objectPath.get(this._object, iOrKeyPath), value)) {
            matchingPath = `${this._path}.${i}`;
            break;
          }
        }
        if (matchingPath) {
          this._path = matchingPath;
        } else {
          this._path = undefined;
        }
      }
    } else {
      this._path = undefined;
    }
    return this;
  }

  resolveString(string) {
    // console.log(string)
    string.match(/(?:[^\.\']+|\'[^\']*\')+/g).forEach((element) => {
      const query = {} as QueryParameters;
      // const e = element.split('?');
      const e = element.split(/(\[.*?\])/);
      // console.log(e);
      if (e.length === 1) {
        query.path = e[0];
      } else {
        query.path = e[0];
        const params = JSON.parse(e[1].replace(/'/g, '"'));
        if (params.length === 2) {
          query.key = params[0];
          query.value = params[1];
        }
        if (params.length === 1) {
          query.value = params[0];
        }
      }
      // console.log(query);
      this.resolve(query);
    });
    return this;
  }
}

export { ObjectPathResolver, objectPath };