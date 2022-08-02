import mongoose, { Schema, Model, Document } from 'mongoose';

export interface UserInterface {
  token: string; email: string; username: string; userType: string
  displayName: string; region: string; language: string;
  password: string; avatarUrl: string; isVerified: boolean;
  referalCode: string; isActivated: boolean; isGoogleAccount: boolean;
}

export interface UserDoc extends UserInterface, Document { }

const userSchema = new Schema({
  email: { type: Schema.Types.String, required: true, unique: true, },
  token: { type: Schema.Types.String, required: false, unique: true },
  region: { type: Schema.Types.String, required: false, unique: false },
  userType: { type: Schema.Types.String, enum: ['ADMIN', 'USER', 'GUEST'], default: 'USER' },
  password: { type: Schema.Types.String, requried: true, unique: false },
  username: { type: Schema.Types.String, required: true, unique: true, },
  avatarUrl: { type: Schema.Types.String, required: false, },
  isVerified: { type: Schema.Types.Boolean, required: true },
  referalCode: { type: Schema.Types.String, requird: true },
  isActivated: { type: Schema.Types.Boolean, required: true },
  displayName: { type: Schema.Types.String, required: false, unique: false, },
  isGoogleAccount: { type: Schema.Types.Boolean, required: true },
},
);

export class User {
  user: UserInterface;
  constructor(user: UserInterface) { this.user = user }

  setRegion(region: UserInterface["region"]) {
    this.user.region = region;
    return this;
  }
  setDisplayName(displayName: UserInterface["displayName"]) {
    this.user.displayName = displayName;
    return this;
  }
  setLanguage(language: UserInterface["language"]) {
    this.user.language = language;
    return this;
  }
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
