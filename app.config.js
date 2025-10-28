// Dynamic Expo config that augments app.json and ensures EAS projectId is present.
// This keeps the main configuration in app.json while allowing EAS to find the
// projectId when linking/building.

const path = require('path');

module.exports = () => {
	// Load the static app.json
	// It contains the top-level { "expo": { ... } } object which we will augment.
	const appJson = require(path.join(__dirname, 'app.json'));

	// Ensure extra.eas.projectId is set so EAS can link the project without trying
	// to write to this file. Replace the projectId value below if you want a
	// different project linked.
	const PROJECT_ID = 'a0638224-39bd-443b-a850-87c352049f9a';

	appJson.expo = appJson.expo || {};
	appJson.expo.extra = appJson.expo.extra || {};
	appJson.expo.extra.eas = Object.assign({}, appJson.expo.extra.eas || {}, { projectId: PROJECT_ID });

	return appJson;
};
