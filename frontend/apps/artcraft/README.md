# Storyteller GGF

## Coding Rules and Styles

```
Short Style Guide TS React and Engine:

No use of lets

No basic for loop operators.
Use the collection operators and array operators.

React Side / No modules over 200 lines. ( loose rule )

Don't do:
if (condition) return;

Do:
if (condition) {
	return;
}

No use of any type.
If you can use chat gpt to create the interface.
```

## Branches

- `main` - The main branch is the production source of truth.

  Changes to main will automatically build, but will not auto-deploy to production. You'll have to promote changes to production using the Netlify control panel.

  Merge your code to main frequently. If you have to have a long-lived set of changes, ask yourself whether it might be better to feature flag your code off and
  land it to main rather than fight rebasing against the whole team.

- `studio-staging` - The staging auto-deploy branch.

  You do not ever need to interact with this branch. Changes to `main` will automatically be pushed to `studio-staging` and auto-deployed to
  https://studio-staging.studio.storyteller.ai . You can test changes that have landed in `main` here before promoting them to production.

- `studio-testing` - The testing branch.

Anyone can push their changes to this branch for testing in a production-like environment. Since it is built and hosted on https://studio-testing.studio.storyteller.ai ,
you won't face CORS issues, same-site cookie issues, or have to use a local development proxy. (This doesn't obviate the need for a development
proxy for fast development iteration, but is a fantastic way to test your changes in a "production-like" environment.)

Force push to this branch by using `git push -f origin studio-testing`

## API Docs

Server API docs live here: https://storyteller-docs.netlify.app/

## Local Testing & Development

### Apple Silicon package installation issues

Installation of some dependencies via npm may fail on M-series macs (like node-canvas) and may require additional setup including python3 and some brew dependencies:

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman python-setuptools
```

### Set up `.env` and the Proxy Server

Copy & paste the env settings from `.env-local-proxy` to `.env`, (if the file `.env` do not exist, simply create one at the root of this project's folder beside the other env settings files).

The settings from `.env-local-proxy` directs all requests to `localhost:3000`, this will relieve us from having to deal with CORS between various services.

Then, start the proxy server in the folder `/proxy`. Before running the proxy for the first time, run:

```
npm i
```

To start the proxy run:

```
npm run dev
```

If the proxy fails, make sure your node version is 18.18. If you need to change the node version
run `npm rebuild` once before re-running `npm run dev`

### Run the Code Locally

To setup and run this project's code locally:

```
npm install
npm run dev
```

## PostHog

PostHog is installed and working. To create a feature flag go to https://us.posthog.com/project/75284/feature_flags
Add the feature flag for all users.

To check the feature flag in the app use code similar to this

```ts
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureflag";
import { FeatureFlags } from "~/enums";

const Component = () => {
  const flag = usePosthogFeatureFlag(FeaturesFlags.FLAG_NAME);
  // if flag is true, the feature shoud be executed & showed;
  // if flag is false, the feature should be disabled & hid;
  // for example
  return(
    <>
      {flag && <ComponentThatDependsOnTheFlag />}
    </>
  );
};
```

## Other Documentation

Here is the Swagger documentation for the backend endpoints

- https://storyteller-docs.netlify.app/

This project uses Remix for routing and Tailwind for styling:

- [Remix Docs](https://remix.run/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)

On Netlify, we use functions:

- [Netlify Functions Overview](https://docs.netlify.com/functions/overview)
