/*global define,console */
/*jslint browser:true,sloppy:true,unparam:true,regexp:true */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
    "dojo/_base/lang",
    "dojo/json",
    "dojo/cookie",
    "dojo/Deferred",
    "dojo/io-query",
    "esri/IdentityManager",
    "dojo/hash"
], function (
    lang,
    JSON,
    cookie,
    Deferred,
    ioQuery,
    IdentityManager,
    hash
) {
    var OAuthHelper = {
        portal: location.protocol + "//www.arcgis.com",
        init: function (parameters) {
            /**
             * parameters = {
             *   appId:       "<String>",
             *   portal:      "<String>", // default is "http://www.arcgis.com"
             *   expiration:   <Number> // in minutes
             * }
             */
            lang.mixin(this, parameters);
            this.portalUrl = this.portal + "/sharing/rest";
            // Read OAuth response from the page url fragment if available,
            // and register with identity manager
            this.checkOAuthResponse(true);
            // Read token from cookie if available, and register
            // with identity manager
            this.checkCookie();
            // You don't need this if you require your users to sign-in
            // before using the app. This override helps trigger OAuth
            // flow instead of the legacy generateToken flow.
            this.overrideIdentityManager();
        },
        isSignedIn: function () {
            return !!IdentityManager.findCredential(this.portalUrl);
        },
        signIn: function () {
            var deferred, authParameters, redirect_uri, l, authUrl;

            this.deferred = new Deferred();
            deferred = this.deferred;
            authParameters = {
                client_id: this.appId,
                response_type: "token",
                expiration: this.expiration // in minutes. Default is 30.
            };
            //if there are url params append the auth parameters with an &
            l = window.location.href;
            if (l.indexOf("?") > 0) {
                redirect_uri = window.location.href.replace(/#.*$/, "") + "&";
            } else {
                redirect_uri = window.location.href.replace(/#.*$/, "");
            }
            authParameters.redirect_uri = redirect_uri;
            authUrl = this.portal.replace(/^http:/i, "https:") + "/sharing/oauth2/authorize?" + ioQuery.objectToQuery(authParameters);
            window.location = authUrl;
            return deferred;
        },
        signOut: function () {
            // Delete the cookie
            cookie("arcgis_auth", null, {
                expires: -1,
                path: "/",
                domain: document.domain
            });
            window.location.reload();
        },
        checkOAuthResponse: function (clearHash) {
            var oauthResponse, error, credential;

            // This method will be called from popup callback page as well
            oauthResponse = this.parseFragment();
            if (oauthResponse) {
                if (clearHash) { // redirection flow
                    // Remove OAuth bits from the URL fragment
                    window.location.hash = "";
                }
                if (oauthResponse.error) {
                    error = new Error(oauthResponse.error);
                    error.details = [oauthResponse.error_description];
                    if (this.deferred) {
                        this.deferred.reject(error);
                    }
                } else {
                    credential = this.registerToken(oauthResponse);
                    // User checked "Keep me signed in" option
                    if (oauthResponse.persist) {
                        if (document.domain === "localhost") {
                            // Do not include the domain because "localhost" won't work. See http://stackoverflow.com/a/489465
                            cookie("arcgis_auth", JSON.stringify(oauthResponse), {
                                // expires: new Date(oauthResponse.expires_at),
                                path: "/"
                            });
                        } else {
                            // Include the domain
                            cookie("arcgis_auth", JSON.stringify(oauthResponse), {
                                //expires: new Date(oauthResponse.expires_at),
                                path: "/",
                                domain: document.domain
                            });
                        }
                        console.log("[Cookie] Write: ", cookie("arcgis_auth"));
                    }
                    if (this.deferred) {
                        this.deferred.resolve(credential);
                    }
                }
            }
        },
        checkCookie: function () {
            var ckie, oauthResponse;

            ckie = cookie("arcgis_auth");
            if (ckie) {
                console.log("[Cookie] Read: ", ckie);
                oauthResponse = JSON.parse(ckie);
                this.registerToken(oauthResponse);
            }
        },
        registerToken: function (oauthResponse) {
            // Register the access token with Identity Manager, so that
            // it can be added to all ArcGIS Online REST API requests
            IdentityManager.registerToken({
                server: this.portalUrl,
                userId: oauthResponse.username,
                token: oauthResponse.access_token,
                expires: oauthResponse.expires_at,
                ssl: oauthResponse.ssl
            });
            var credential = IdentityManager.findCredential(this.portalUrl, oauthResponse.username);
            console.log("Token registered with Identity Manager: ", credential);
            return credential;
        },
        parseFragment: function () {
            var h, fragment;

            h = hash();
            fragment = h ? ioQuery.queryToObject(h) : null;
            if (fragment) {
                if (fragment.access_token) {
                    console.log("[OAuth Response]: ", fragment);
                    // Convert from String to Number
                    fragment.expires_in = Number(fragment.expires_in);
                    // Calculate universal time
                    fragment.expires_at = (new Date()).getTime() + (fragment.expires_in * 1000);
                    fragment.ssl = (fragment.ssl === "true");
                } else if (fragment.error) {
                    console.log("[OAuth Error]: ", fragment.error, " - ", fragment.error_description);
                }
                return fragment;
            }
        },
        overrideIdentityManager: function () {
            var signInMethod, helper;

            signInMethod = IdentityManager.signIn;
            helper = this;
            IdentityManager.signIn = function (url, serverInfo) {
                return (serverInfo.server.indexOf(".arcgis.com") !== -1) ?
                        // OAuth flow
                        helper.signIn() :
                        // generateToken flow
                        signInMethod.apply(this, arguments);
            };
        }
    };
    window.OAuthHelper = OAuthHelper;
    return OAuthHelper;
});
