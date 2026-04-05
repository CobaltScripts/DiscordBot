export type ArgumentType = 'string' | 'number' | 'boolean' | 'user' | 'role' | 'channel';

export interface ArgumentOptions {
  name: string;
  description: string;
  type: ArgumentType;
  required?: boolean;
  choices?: { name: string; value: string | number }[];
}

export class Argument {
  public readonly name: string;
  public readonly description: string;
  public readonly type: ArgumentType;
  public readonly required: boolean;
  public readonly choices: { name: string; value: string | number }[] | undefined;

  constructor(options: ArgumentOptions) {
    this.name = options.name;
    this.description = options.description;
    this.type = options.type;
    this.required = options.required ?? true;
    this.choices = options.choices;
  }
}
