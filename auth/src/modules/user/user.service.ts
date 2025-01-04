import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDoc } from './schemas/user.schema';
import { Model } from 'mongoose';
import { NatsService } from '../nats/nats.service';
import { UserCreatedEvent } from '../nats/events/user-created.event';
import { Subjects } from '../nats/events/subjects';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Provider, TokenPayload, UserRole } from '../auth/types';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserUpdatedEvent } from '../nats/events/user-updated.event';

@Injectable()
export class UserService {
  constructor(
    @InjectPinoLogger(UserService.name)
    private logger: PinoLogger,
    @InjectModel(User.name) private userModel: Model<UserDoc>,
    private natsService: NatsService,
  ) {}

  public async createUser(userData: Partial<UserDoc>) {
    const user = new this.userModel({
      role: UserRole.User,
      provider: userData.provider,
      password: userData.password,
      username: userData.username,
      googleId: userData.googleId,
    });

    try {
      const createdUser = await user.save();

      this.natsService.publish<UserCreatedEvent>(Subjects.UserCreated, {
        id: createdUser.id,
        username: createdUser.username,
        version: createdUser.version,
        googleId: createdUser.googleId,
      });

      return createdUser;
    } catch (err) {
      this.logger.error(err);
      throw new HttpException('Could not create user', HttpStatus.BAD_REQUEST, {
        cause: err,
      });
    }
  }

  public async updateProfile(
    user_: TokenPayload,
    updatedProfile: UpdateProfileDto,
  ) {
    console.log(user_, updatedProfile);
    const usernameExists = await this.findByUsername(updatedProfile.username);

    if (usernameExists) {
      throw new HttpException(
        'username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userModel.findById(user_.id);

    user.set({
      username: updatedProfile.username,
    });

    const updatedUser = await user.save();

    this.natsService.publish<UserUpdatedEvent>(Subjects.UserUpdated, {
      id: user.id,
      username: user.username,
      version: user.version,
    });

    return updatedUser;
  }

  public async findByGoogleId(googleId: string) {
    const user = await this.userModel.findOne({
      googleId,
      provider: Provider.Google,
    });

    return user;
  }

  public async findByUsername(username: string) {
    const user = await this.userModel.findOne({
      username,
    });

    return user;
  }

  public async findLocalByUsername(username: string) {
    const user = await this.userModel.findOne({
      username,
      provider: Provider.Local,
    });

    return user;
  }
}
