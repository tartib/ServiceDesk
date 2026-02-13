/**
 * Base Command class for the CQRS Pattern
 * Used to encapsulate commands that modify state
 */
export abstract class Command {
  abstract execute(): Promise<unknown>;
}

/**
 * Command Handler interface
 */
export interface ICommandHandler<T extends Command = Command, R = unknown> {
  handle(command: T): Promise<R>;
}

/**
 * Command Bus for executing commands
 */
export class CommandBus {
  private static instance: CommandBus;
  private handlers: Map<string, ICommandHandler> = new Map();

  private constructor() {}

  static getInstance(): CommandBus {
    if (!CommandBus.instance) {
      CommandBus.instance = new CommandBus();
    }
    return CommandBus.instance;
  }

  /**
   * Register a command handler
   */
  register<T extends Command>(
    commandType: string,
    handler: ICommandHandler<T>
  ): void {
    this.handlers.set(commandType, handler);
  }

  /**
   * Execute a command
   */
  async execute<T extends Command, R = unknown>(command: T): Promise<R> {
    const commandType = command.constructor.name;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType}`);
    }

    return handler.handle(command) as Promise<R>;
  }
}
