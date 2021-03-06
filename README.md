# Ownfiles - A library for handling files in Solid Pods

The [Solid](https://solid.mit.edu/) project allows people to use apps on the Web while keeping ownership of their data and choosing where to store it.  
[Ownfiles](https://www.npmjs.com/ownfiles) is intended to help with file operations on resources saved with Solid.

## Table of Contents

1. [Installing](#installing)
2. [Methods](#methods)
    * [Read](#read)
    * [Delete](#delete)
    * [Create](#create)
    * [Copy](#copy)
    * [Rename](#rename)
3. [Contributing](#contributing)
    * [Testing](#testing)
    * [Authentication](#authentication)

## Installing

`npm install ownfiles`  

The library is intended for browser usage, to use it in a node environment you'll need to add a credentials file as described in [Authentication](#authentication)


## Constructor
To get started you need to import and instantiate the fileClient with either a [WebId](https://github.com/solid/solid-spec/blob/master/solid-webid-profiles.md) or the root url of an existing pod:
```javascript
import FileClient from 'ownfiles';
const fileClient = new FileClient({podUrl: "https://ludwig.owntech.de/"}); // alternative to {webId: "https://ludwig.owntech.de/profile/card#me"}
```

## Methods

### Read

The same operation on a folder will return a folder object that holds the contents:

```javascript
const url = "https://ludwig.owntech.de/profile/card#me";
fileClient.read(url).then((content) => {
  console.log(content);
  // do something with the content of the file
});

const url = "https://ludwig.owntech.de/profile/";
fileClient.read(url).then((folder) => {
  console.log(folder.files); 
  console.log(folder.folders);
  // both will default to an empty array
});
```

### Delete

Deleting a folder is indifferent from a file since both promises return nothing. However for deleting folders you'll need to make sure **the folder url ends with a slash**.

```javascript
const url = "https://ludwig.owntech.de/profile/card#me";
fileClient.delete(url).then(() => {
  ...
});
```

### Create

To create a file with some payload you'll need to pass the payload, with the content type into the optional options parameter as a string:

```javascript
const someContent = "Hello World!";
const url = "https://ludwig.owntech.de/hello-world";
fileClient.create(url, {contents: someContent, contentType: "text/plain"}).then(() => {
  ...
});
```

One also has the ability to pass triples as a payload:

```javascript
const someTriples = store.each();
const url = "https://ludwig.owntech.de/profile/card#me";
fileClient.create(url, {contents: someTriples}).then(() => {
  ...
});
```

Creating a folder doesn't require any additional params, just the url, which, again, **should end with a slash**.

### Copy

To copy a resource you'll need to pass the file or folder to copy, and the location to copy it to:

```javascript
const file = "https://ludwig.owntech.de/hello-world";
const newLocation = "https://ludwig.owntech.de/private/"
fileClient.create(file, newLocation).then(() => {
  ...
});
```

### Rename

To rename a folder or a file you'll need to pass the resource-url and the new name to the respective function:

```javascript
const file = "https://ludwig.owntech.de/hello-world";
const newName = "helloWorld"
fileClient.renameFile(file, newName).then(() => {
  ...
});
```

for folders:

```javascript
const file = "https://ludwig.owntech.de/photos";
const newName = "photos-of-friends"
fileClient.renameFolder(file, newName).then(() => {
  ...
});
```

## Contributing

In general contributions are very welcome, feel free to work on and open pull requests in regards to issues/optimizations you see. 
Please write a test or use an existing test in your development process, so that we can make sure your contribution integrates smoothly.

### Testing

To test this library we decided on using mocha and chai.
To run the tests simply run `npm run test`

Since the operations are all asynchronous it can come to complications between the tests (we're working on that), so to test singularly run:
`node_modules/mocha/bin/mocha name_of_test.test.js`

### Authentication

To authenticate you'll need to install the `solid-auth-cli` npm package.  
Then Create a credentials file in your home directory called `~/.solid-auth-cli-config.json` with the following fields: 

```javascript
{
  "idp": YOURIDPROVIDER,
  "username": USERNAME,
  "password": PASSWORD
}
```
