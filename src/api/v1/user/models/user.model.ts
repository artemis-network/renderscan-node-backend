import mongoose, { Schema, Model, Document } from 'mongoose';

export interface UserInterface {
  username: string; email: string; password: string; isGoogleAccount: Boolean,
  isVerified: Boolean, isActivated: Boolean, token: string, userType: string
}

export interface UserDoc extends UserInterface, Document { }

const userSchema = new Schema({
  username: { type: Schema.Types.String, required: true, unique: true, },
  email: { type: Schema.Types.String, required: true, unique: true, },
  password: { type: Schema.Types.String, requried: true, },
  isGoogleAccount: { type: Schema.Types.Boolean, required: true },
  isVerified: { type: Schema.Types.Boolean, required: true },
  isActivated: { type: Schema.Types.Boolean, required: true },
  token: { type: Schema.Types.String, },
  userType: { type: Schema.Types.String, enum: ['ADMIN', 'USER', 'GUEST'], default: 'USER' }
});

export class User {
  user: UserInterface;
  constructor(user: UserInterface) {
    this.user = user;
  }
  setFirstname(email: UserInterface["email"]) {
    this.user.email = email
    return this;
  }

  setLastname(password: UserInterface["password"]) {
    this.user.password = password;
    return this;
  }
  setUsername(username: UserInterface["username"]) {
    this.user.username = username
    return this;
  }
  get() {
    return this.user;
  }
}

export const UserModel: Model<UserDoc> = mongoose.model<UserDoc>("USER", userSchema);