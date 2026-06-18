import * as crypto from 'crypto';

export class TagEntity {
  readonly id: string;
  readonly name: string;

  constructor(properties: { id: string; name: string }) {
    this.id = properties.id;
    this.name = properties.name;
  }

  static create(properties: { name: string; id?: string }): TagEntity {
    if (!properties.name || properties.name.trim() === '') {
      throw new Error('O nome da tag não pode ser vazio.');
    }

    return new TagEntity({
      id: properties.id ?? crypto.randomUUID(),
      name: properties.name.trim().toLowerCase(), // normaliza para minúsculo
    });
  }
}
