import chalk from 'chalk';

export class Logger {
  public static success(message: string): void {
    this.log(message, chalk.green);
  }

  public static info(message: string): void {
    this.log(message, chalk.blue);
  }

  public static warn(message: string): void {
    this.log(message, chalk.yellow);
  }

  public static error(message: string): void {
    this.log(message, chalk.red);
  }

  private static log(message: string, colorFn: (text: string) => string): void {
    const timestamp = this.formatTimestamp();
    console.log(colorFn(`[${timestamp}] ${message}`));
  }

  private static formatTimestamp(): string {
    const now = new Date();

    return [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  }
}
