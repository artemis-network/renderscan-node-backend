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
  constructor(user: UserInterface) { this.user = user }
  setEmail(email: UserInterface["email"]) {
    this.user.email = email
    return this;
  }
  setUsername(username: UserInterface["username"]) {
    this.user.username = username
    return this;
  }
  setPassword(password: UserInterface["password"]) {
    this.user.password = password;
    return this;
  }
  setIsGoogleAccount(isGoogleAccount: UserInterface["isGoogleAccount"]) {
    this.user.isGoogleAccount = isGoogleAccount;
    return this;
  }
  setIsVerified(isVerified: UserInterface["isVerified"]) {
    this.user.isVerified = isVerified;
    return this;
  }
  setIsActivated(isActivated: UserInterface["isActivated"]) {
    this.user.isActivated = isActivated;
    return this;
  }
  setToken(token: UserInterface["token"]) {
    this.user.token = token;
    return this;
  }
  setUserType(userType: UserInterface["userType"]) {
    this.user.userType = userType;
    return this;
  }
  get() {
    return this.user;
  }
}

export const USER_NAMING: string = "USER";

export const UserModel: Model<UserDoc> = mongoose.model<UserDoc>(USER_NAMING, userSchema);