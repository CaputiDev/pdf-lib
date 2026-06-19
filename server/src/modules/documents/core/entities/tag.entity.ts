import * as crypto from 'crypto';
import { InvalidDocumentException } from '../exceptions/document.exceptions';

export class TagEntity {
  readonly id: string;
  readonly name: string;

  constructor(properties: { id: string; name: string }) {
    this.id = properties.id;
    this.name = properties.name;
  }

  static create(properties: { name: string; id?: string }): TagEntity {
    if (!properties.name || properties.name.trim() === '') {
      throw new InvalidDocumentException('O nome da tag não pode ser vazio.');
    }

    const name = properties.name.trim().toLowerCase();
    const regex = /^[\p{L}\p{N}]+$/u;
    if (!regex.test(name)) {
      throw new InvalidDocumentException(
        `A tag "${properties.name}" contém símbolos ou espaços inválidos. Use apenas letras e números.`,
      );
    }

    return new TagEntity({
      id: properties.id ?? crypto.randomUUID(),
      name,
    });
  }
}
