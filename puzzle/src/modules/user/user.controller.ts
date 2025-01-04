import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { Subjects } from '../nats/events/subjects';
import { UserCreatedEvent } from '../nats/events/user-created.event';
import { NatsStreamingContext } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDoc } from './schemas/user.schema';
import { Model } from 'mongoose';
import { UserUpdatedEvent } from '../nats/events/user-updated.event';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller()
export class UserController {
  constructor(
    @InjectPinoLogger(UserController.name)
    private logger: PinoLogger,
    @InjectModel(User.name)
    private userModel: Model<UserDoc>,
  ) {}

  @EventPattern(Subjects.UserUpdated)
  public async userUpdatedHandler(
    @Payload() data: UserUpdatedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    this.logger.info("Received 'user:updated' event. Applying changes");

    const { id, version, username } = data;
    console.log(data);
    const user = await this.userModel.findOne({
      _id: id,
      version: version - 1,
    });

    user.set({
      username,
    });

    await user.save();

    message.ack();
  }

  @EventPattern(Subjects.UserCreated)
  public async userCreatedHandler(
    @Payload() data: UserCreatedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    this.logger.info("Received 'user:created' event. Applying changes");

    const { id, username, version } = data;
    const user = new this.userModel({
      _id: id,
      username,
      version,
    });

    try {
      await user.save();
      message.ack();
    } catch (error) {
      this.logger.error(
        'Creating user failed. Event rejected and will be redelivered soon',
      );
    }
  }
}
