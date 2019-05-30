/* Notable docs (for firebase api only):
  
  Getting Started: https://firebase.google.com/docs/cli/

  --- HOSTING ---
  https://firebase.google.com/docs/hosting/
  https://firebase.google.com/docs/hosting/use-cases
  https://firebase.google.com/docs/hosting/full-config

  --- AUTHENTICATION ---
  https://firebase.google.com/docs/auth
  https://firebase.google.com/docs/auth/admin/manage-users#create_a_user
  https://firebase.google.com/docs/auth/admin/custom-claims

  --- FIRESTORE ---
  https://firebase.google.com/docs/firestore/query-data/queries
  https://firebase.google.com/docs/firestore/manage-data/delete-data
  https://firebase.google.com/docs/firestore/query-data/get-data

  --- FUNCTIONS ---
  https://firebase.google.com/docs/functions/get-started
  https://firebase.google.com/docs/functions/local-emulator

  --- WEB ---
  https://firebase.google.com/docs/auth/web/manage-users
  https://firebase.google.com/docs/auth/web/password-auth
  https://firebase.google.com/docs/auth/web/firebaseui

  To solve firebase local emulator error on windows, check out:
  https://github.com/firebase/firebase-tools/issues/1280

  --- OUR BELOVED SAVIOR, STACKOVERFLOW ---
  https://stackoverflow.com/questions/46257738/cant-reference-public-folder-from-node-js-deployment-with-firebase
  https://stackoverflow.com/questions/46630507/how-to-run-a-geo-nearby-query-with-firestore
  https://stackoverflow.com/questions/46603691/how-to-save-geopoint-in-firebase-cloud-firestore
  https://stackoverflow.com/questions/51295561/firebase-functions-functions-is-not-defined
  https://stackoverflow.com/questions/44899658/how-to-authenticate-an-user-in-firebase-admin-in-nodejs
  https://stackoverflow.com/questions/37883981/cant-get-currentuser-on-load
  https://stackoverflow.com/questions/19537225/map-setcenter-function-is-not-working-properly
  https://stackoverflow.com/questions/46880323/how-to-check-if-a-cloud-firestore-document-exists-when-using-realtime-updates
  https://stackoverflow.com/questions/49188722/how-to-http-request-by-post-method-with-kotlin
  https://stackoverflow.com/questions/46721517/google-firestore-how-to-get-document-by-multiple-ids-in-one-round-trip
  https://stackoverflow.com/questions/46900430/firestore-getting-documents-id-from-collection
  https://stackoverflow.com/questions/48541270/how-to-add-document-with-custom-id-to-firestore-angular
  https://stackoverflow.com/questions/5976854/how-to-disable-google-maps-satellite-view
  https://stackoverflow.com/questions/37413111/adding-the-displayname-whilst-using-createuserwithemailandpassword
  ---
  https://stackoverflow.com/questions/16771225/css3-rotate-animation
  https://github.com/daneden/animate.css/
  https://github.com/xavame/xavame.github.io/blob/development/pages/_slug.vue
  https://codepen.io/HugoGiraudel/pen/4ab4d7e6e21b63ee0ba51bdd7b3b2abb
  https://developers.google.com/maps/documentation/javascript/examples/event-simple

  --- OTHER RESOURCES ---
  https://blog.usejournal.com/build-a-serverless-full-stack-app-using-firebase-cloud-functions-81afe34a64fc
  https://gist.github.com/zenorocha/9282426622fc8f46a6caeff40008de75
  https://github.com/firebase/functions-samples/blob/master/username-password-auth/functions/index.js
  https://medium.com/from-the-scratch/firebase-things-you-must-know-to-avoid-wasting-time-as-a-beginner-f327090e451d
  https://howtofirebase.com/mildly-secret-custom-claims-58d7ff930e06
  https://medium.com/google-developers/controlling-data-access-using-firebase-auth-custom-claims-88b3c2c9352a
  https://developers.google.com/maps/documentation/javascript/get-api-key
  https://angularfirebase.com/lessons/geolocation-query-in-firestore-realtime/
  https://webbjocke.com/javascript-check-data-types/
  https://itnext.io/working-with-firebase-functions-http-request-22fd1ab644d3
  https://en.wikipedia.org/wiki/Geohash

  More resources can occur as commented above each use.
*/
const functions = require('firebase-functions');
const admin = require('firebase-admin')
const serviceAccount = require('./service-account.json');
/* https://github.com/expressjs/cors */
const cors = require('cors')({ origin: true });
/* https://github.com/geofirestore/geofirestore-js */
const { GeoFirestore } = require('geofirestore');
/* https://github.com/chrisveness/latlon-geohash */
const Geohash = require('latlon-geohash');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
});

// Create a Firestore reference
const firestore = admin.firestore();
// Create a GeoFirestore reference
const geofirestore = new GeoFirestore(firestore);

// Checks http request type and moves accordingly
needsToBeType = (req, res, type, callback) => {
  if (req.method !== type) {
    return res.status(401).json({
      status: false,
      message: 'Not allowed'
    })
  } else {
    callback(req, res);
  }
};

// Creates a response with given parameters
createResponse = (res, code, message, returnObj) => {
  statusByCode = {
    200: true,
    400: false
  }
  return res.status(code).json({
    status: statusByCode[code],
    message,
    returnObj
  })
}

// Gets all categories
exports.categories = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "GET", () => {
      let col = firestore.collection('companies');
      col.get().then(function (querySnapshot) {
        let returnObj = {};
        querySnapshot.forEach(function (doc) {
          doc.data().d.KampanyaKategori.map(el => {
            returnObj[el] = 1;
          })
        });
        return createResponse(res, 200, 'Successfully listed.', Object.keys(returnObj));
      });
    });
  })
});

// Gets all discounts within radius
exports.radius = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "POST", () => {
      if (!req.body.currentLocation || !req.body.currentLocation.lat || !req.body.currentLocation.lng) return createResponse(res, 400, 'Location is not provided.');
      if (!req.body.radius) return createResponse(res, 400, 'Radius is not provided.');

      const geocollection = geofirestore.collection('companies');
      // Create a GeoQuery based on a location
      const query = geocollection.near({
        center: new admin.firestore.GeoPoint(req.body.currentLocation.lat, req.body.currentLocation.lng),
        radius: req.body.radius
      });

      // Get query (as Promise)
      query.get()
        .then((value) => {
          /* https://stackoverflow.com/questions/46721517/google-firestore-how-to-get-document-by-multiple-ids-in-one-round-trip */
          firestore.getAll(...value.docs.map(el => firestore.doc(`companies/${el.id}`)))
            .then(docs => {
              let returnObj = [];
              docs.forEach(function (doc) {
                returnObj.push(doc.data().d);
              });
              return createResponse(res, 200, 'Successfully listed.', returnObj);
            })
            .catch(function (error) {
              return createResponse(res, 400, 'Cannot get document from Geo.');
            });
        })
        .catch(function (error) {
          return createResponse(res, 400, 'FAILED.' + error);
        });
    });
  });
});

// Lists all discounts
exports.list = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "GET", () => {
      let tag = "";
      //HAS TAG 
      if (req.url.startsWith("/list/")) {
        tag = req.url.substr(6);
        /* https://stackoverflow.com/questions/388996/regex-for-javascript-to-allow-only-alphanumeric */
        /* https://stackoverflow.com/questions/38511176/removing-unwanted-characters-from-string-using-javascript-regex-for-feeding-into */
        tag = tag.replace(/[\n\t\r]/g, "")
        tag = decodeURIComponent(tag);
      }

      let col = firestore.collection('companies');
      if (tag) {
        col = col.where('d.KampanyaKategori', 'array-contains', tag)
      }
      col.get().then(function (querySnapshot) {
        let returnObj = [];
        querySnapshot.forEach(function (doc) {
          returnObj.push(doc.data().d);
        });
        return createResponse(res, 200, 'Successfully listed.', returnObj);
      });
    });
  })
})

// Adds item to database
exports.addItem = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "POST", () => {

      // Check if all the infos are provided
      if (!req.body.name || !req.body.id || !req.body.location || !req.body.content || !req.body.category || !req.body.time || !req.body.token) {
        return createResponse(res, 400, 'One or more fields not found in the JSON data.');
      }

      // Weak type recognition
      if (typeof req.body.name !== "string" ||
        typeof req.body.id !== "string" ||
        typeof req.body.location !== "object" ||
        typeof req.body.content !== "string" ||
        typeof req.body.category !== "object" ||
        typeof req.body.time !== "number" ||
        typeof req.body.token !== "string") {
        return createResponse(res, 400, 'One or more fields not defined properly.');
      }

      // Verify the ID token first.
      admin.auth().verifyIdToken(req.body.token)
        .then((claims) => {
          // Allow access to requested admin resource.
          if (claims.admin === true) {
            firestore.collection('companies').doc(req.body.id).set({
                g: Geohash.encode(req.body.location[0], req.body.location[1], [12]),
                l: new admin.firestore.GeoPoint(req.body.location[0], req.body.location[1]),
                d: {
                  FirmaAdi: req.body.name,
                  FirmaID: req.body.id,
                  FirmaLokasyon: new admin.firestore.GeoPoint(req.body.location[0], req.body.location[1]),
                  KampanyaIcerik: req.body.content,
                  KampanyaKategori: req.body.category,
                  KampanyaSuresi: admin.firestore.Timestamp.fromDate(new Date(req.body.time)),
                }
              })
              .then(ref => {
                // Return reference id if successful
                return createResponse(res, 200, "Successfully added new company.", {
                  id: req.body.id
                });
              })
              .catch(function (error) {
                return createResponse(res, 400, `Something went wrong.`);
              });
          } else {
            return createResponse(res, 400, `You are not an admin. Please ask your admin to be an admin.`);
          }
        })
        .catch(function (error) {
          console.log("error:", error)
          return createResponse(res, 400, "Could not verify admin token.");
        });

    });
  });
});

// Removed item from database
exports.removeItem = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "POST", () => {

      // Check if all the infos are provided
      if (!req.body.id || !req.body.token) {
        return createResponse(res, 400, 'One or more fields not found in the JSON data.');
      }

      // Weak type recognition
      if (typeof req.body.id !== "string" ||
        typeof req.body.token !== "string") {
        return createResponse(res, 400, 'One or more fields not defined properly.');
      }

      // Verify the ID token first.
      admin.auth().verifyIdToken(req.body.token)
        .then((claims) => {
          // Allow access to requested admin resource.
          if (claims.admin === true) {

            firestore.collection('companies').doc(req.body.id).delete().then(() => {
              return createResponse(res, 200, `Successfully removed.`);
            }).catch((error) => {
              return createResponse(res, 400, `Could not remove item.`);
            });
          } else {
            return createResponse(res, 400, `You are not an admin. Please ask your admin to be an admin.`);
          }
        })
        .catch(function (error) {
          return createResponse(res, 400, "Could not verify admin token.");
        });

    });
  });
});



/* THESE FUNCTIONS ARE NOT NECESSARY ANYMORE, EXCEPT ADDADMINROLE. USE IT AS YOU WISH */
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from a Severless Database!");
});
exports.register = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "POST", () => {
      if (!req.body.username) return createResponse(res,400,'Username is not provided.');
      if (!req.body.email) return createResponse(res,400,'E-mail is not provided.');
      if (!req.body.password) return createResponse(res,400,'Password is not provided.');
      admin.auth().createUser({
          email: req.body.email,
          password: req.body.password,
          displayName: req.body.username
        }).then(function (userRecord) {
          // See the UserRecord reference doc for the contents of userRecord.
          console.log('Successfully created new user:', userRecord.uid);
          return createResponse(res,200,'Account creation is successful.');
        })
        .catch(function (error) {
          return createResponse(res,400,'Account creation failed.');
        });
    });
  })
})
// Source for claims: https://www.youtube.com/watch?v=3hj_r_N0qMs
//                  : https://www.youtube.com/watch?v=4wa3CMK4E2Y
// In need of adding admin claim, uncomment this and send a post request
exports.addAdminRole = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    needsToBeType(req, res, "POST", () => {
      if (!req.body.email) return createResponse(res,400,'E-mail is not provided.');
      admin.auth().getUserByEmail(req.body.email).then(user => {
        admin.auth().setCustomUserClaims(user.uid, {
          admin: true
        })
      }).then(()=>{
        return createResponse(res,200,`Success! ${req.body.email} has been made an admin.`);
      }).catch(err => {
        return createResponse(res,400,`Success! Error while making account admin.`);
      })
     if (!req.body.email) return createResponse(res,400,`Setting admin claims are disabled.`);
    });
  });
});
*/