import mongoose, { Schema, Model, Document } from 'mongoose';

export interface UserInterface {
  token: string; email: string; username: string; userType: string
  password: string; avatarUrl: string; isVerified: Boolean,
  referalCode: string; isActivated: Boolean, isGoogleAccount: Boolean,
}

export interface UserDoc extends UserInterface, Document { }

const userSchema = new Schema({
  username: { type: Schema.Types.String, required: true, unique: true, },
  avatarUrl: { type: Schema.Types.String, required: false, },
  email: { type: Schema.Types.String, required: true, unique: true, },
  password: { type: Schema.Types.String, requried: true, },
  isGoogleAccount: { type: Schema.Types.Boolean, required: true },
  isVerified: { type: Schema.Types.Boolean, required: true },
  isActivated: { type: Schema.Types.Boolean, required: true },
  token: { type: Schema.Types.String, },
  userType: { type: Schema.Types.String, enum: ['ADMIN', 'USER', 'GUEST'], default: 'USER' },
  referalCode: { type: Schema.Types.String, requird: true },
},
);

export class User {
  user: UserInterface;
  constructor(user: UserInterface) { this.user = user }

  setAvatar(avatarUrl: UserInterface["avatarUrl"]) {
    this.user.avatarUrl = avatarUrl;
    return this;
  }

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
  setReferalCode(referalCode: UserInterface["referalCode"]) {
    this.user.referalCode = referalCode;
    return this;
  }
  get() { return this.user; }
}

export const USER_NAMING: string = "USER";

export const UserModel: Model<UserDoc> = mongoose.model<UserDoc>(USER_NAMING, userSchema);
