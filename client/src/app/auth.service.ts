// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Injectable, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Auth } from "aws-amplify";
import { CognitoUser } from "amazon-cognito-identity-js";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private cognitoUser: CognitoUser & {
    challengeParam: { phone_number: string };
  };

  // Get access to window object in the Angular way
  private window: Window;
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.window = this.document.defaultView;
  }

  public async signIn(email: string) {
    this.cognitoUser = await Auth.signIn(email);
  }

  public async signOut() {
    await Auth.signOut();
  }

  public async answerCustomChallenge(answer: string) {
    this.cognitoUser = await Auth.sendCustomChallengeAnswer(
      this.cognitoUser,
      answer
    );
    return this.isAuthenticated();
  }

  public async getPublicChallengeParameters() {
    console.log(JSON.stringify(this.cognitoUser));
    return this.cognitoUser.challengeParam;
  }

  public async signUp(
    phoneNumber: string,
    firstName: string,
    lastName: string,
    email: string,
    birthdate: string
  ) {
    const params = {
      username: phoneNumber,
      password: this.getRandomString(30),
      attributes: {
        given_name: firstName,
        family_name: lastName,
        email,
        phone_number: phoneNumber,
        birthdate,
      },
    };
    await Auth.signUp(params);
  }

  private getRandomString(bytes: number) {
    const randomValues = new Uint8Array(bytes);
    this.window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues).map(this.intToHex).join("");
  }

  private intToHex(nr: number) {
    return nr.toString(16).padStart(2, "0");
  }

  public async isAuthenticated() {
    try {
      await Auth.currentSession();
      return true;
    } catch {
      return false;
    }
  }

  public async getUserDetails() {
    if (!this.cognitoUser) {
      this.cognitoUser = await Auth.currentAuthenticatedUser();
    }
    return await Auth.userAttributes(this.cognitoUser);
  }
}
