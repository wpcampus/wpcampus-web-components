# WPCampus Web Components

Web components used by the WPCampus organization.

## Customize web components

### Notifications
Our notifications web component is extendable with the following properties, which you can modify by creating the element with JavaScript.

- **notificationsURL**: the URL used to request the notification information
- **localStorageSeconds**: how long the notification is cached in local storage (in seconds)
- **requestUpdateSeconds**: how often to check for a notification update (in seconds)
- **requestUpdateMax**: how many requests to make for notification updates before going to sleep

### Example

```
// Create the element with JavaScript.
var notifications = document.createElement("wpcampus-notifications");

// You can change the following notification properties. The following are defaults.
//notifications.notificationsURL = ""
//notifications.localStorageSeconds = 300
//notifications.requestUpdateSeconds = 300
//notifications.requestUpdateMax = 2

// Add the element to the page.
document.body.appendChild(notifications);
```

## Local development

If you want to develop this project locally, you need to run the following command for the project in which you want to use the web components.

You'll want to use `npm install` or `yarn add` depending on the project.

`yarn add /Users/{absolute path to folder}/wpcampus-web-components --check-files`

## Disclaimer

This repo is shared for educational purposes. Feel free to explore, copy, submit fixes, and share the code.

**However, please respect that the WPCampus branding and design are intended solely for the WPCampus organization.**
