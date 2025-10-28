// Dynamic Expo config that augments app.json and ensures EAS projectId is present.
// This keeps the main configuration in app.json while allowing EAS to find the
// projectId when linking/building.

const path = require('path');

module.exports = () => {
	// Load the static app.json
	// It contains the top-level { "expo": { ... } } object which we will augment.
	const appJson = require(path.join(__dirname, 'app.json'));

	// Prefer an explicit environment variable to control which EAS project is
	// used. If none is provided, fall back to any projectId already present
	// in the static app.json. If still none, do not inject a projectId so the
	// local EAS CLI can create or link a project interactively.
	const PROJECT_ID = process.env.EXPO_EAS_PROJECT_ID || process.env.EAS_PROJECT_ID || (appJson.expo && appJson.expo.projectId) || null;

	appJson.expo = appJson.expo || {};
	// Ensure runtimeVersion and updates keys exist to avoid tooling errors
	// that attempt to read nested properties such as runtimeVersion.policy.
	appJson.expo.runtimeVersion = appJson.expo.runtimeVersion || { policy: 'appVersion' };
	appJson.expo.updates = appJson.expo.updates || {};
	appJson.expo.extra = appJson.expo.extra || {};
	if (PROJECT_ID) {
		appJson.expo.extra.eas = Object.assign({}, appJson.expo.extra.eas || {}, { projectId: PROJECT_ID });
	}

	return appJson;
};
