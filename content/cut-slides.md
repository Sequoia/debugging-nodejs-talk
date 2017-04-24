
---

# Logging

* What to log
* What tools are available
* Enabling & disabling logging

???

&rarr; Start by looking at what Node.js has built in

---

# Node Core APIs

* `console`
  * `log`
  * `error`
  * `timer`
* Errors

???
Talk a

---
name: console

# The `console` Object
???
* Similar to browser, a couple differences
* stdout, stderr

---
template: console

## `console.log`
--

* aka `console.info`
--

* &rarr; `STDOUT`
--

* `sprintf` style formatting

---

## `console.log` sprintf

```js
server.on('listening', function(){
  
  const pid = process.pid;
  const port = server.address().port || 80;

  console.log('process %d listening on port %d', pid, port);
});
```

???

* It's like SPRINTF

--
----

```no-highlight
$ node server.js
process 53594 listening on 3000
```

---
template:console

## `console.error`
--

* `console.warn`
--

* &rarr; `STDERR`
--

  * **Output redirection**
???
* Of course you can redirect stderr output to error loggers
* outputting to stderr directs that output to some logging tools

--> output redirection

---

## `console.log` sprintf

```js
server.on('error', function(e){
  console.error(e);
  //other error handling
});
```

--

```no-highlight
$ node server.js 2>>/var/logs/server.log
$ cat /var/logs/server.log
Port 3000 is already in use
```

???

**Uses standard UNIX idioms!!**

* there are more advanced tools we'll talk about but relying on the OS & standard conventions is great when possible
* No need to reinvent the wheel

---
class:biglist

# The `Error` Object

* `e.message`
* `e.stack`

???

&rarr; Stack only exists if you throw an ERROR!!


---
class:biglist

## System Errors

* `error.code`
* `error.errno`
* `error.syscall`
* `error.path`
* `error.address`
* `error.port`

???
* Regular JS errors but augmented with more info
* From system/OS
* Not all these keys will be present

---

## `error.code`

.biglist[
* Always start with "`E`"
* From OS
* Defined by POSIX error codes
]

???

Other things may be set, depends on OS

--

.small-list[
* `EACCES`
* `EADDRINUSE`
* `ECONNREFUSED`
* `ECONNRESET`
* etc.
]

---

## `error.code`

```js
fs.readFile(filename, function(err, data){
  if(err){
*   if (err.code === 'EACCES'){
      response.statusCode = '403';
      response.statusMessage = 'Access Denied!!';
    }
*   if (err.code === 'ENOENT'){
      response.statusCode = '404';
      response.statusMessage = 'Not found';
    }else{
      // something else
      response.statusCode = '500';
      response.statusMessage = 'Something happened... :(';
    }
    return response.end()
  }
  //...
})
```
???
HTTP server example:

* Translate system error code to HTTP error code

---

## Other Console APIs

* **`console.trace`**: Prints stack trace to `STDERR`
* **`console.time`**: Timer
* **`console.timeEnd`**: Timer

Todo : Move this up/cut?

--

```js
console.time('db Users query');
db.Users.find(function processUsers(e, users){
  console.timeEnd('db Users query');
  //...
});
```

### Output

```no-highlight
db Users query: 225.438ms
```

???
* Prints to stdout
* We'll look at more useful ways to capture timing info later on

&rarr; improved console.logging

---

## More Launch Configs

```js
{
    "version": "0.3.0",
    "configurations": [
    {
      "name": "Launch",
      "type": "node",
      "request": "launch",
      "program": "${workspaceRoot}/node_modules/.bin/node-lambda",
*     "stopOnEntry": false,
      "args": ["run"],
      "cwd": "${workspaceRoot}",
*     "preLaunchTask": null,
      "runtimeExecutable": null,
      "runtimeArgs": [
        "--nolazy"
      ],
      "env": {
        "NODE_ENV": "development"
      },
      "externalConsole": false,
*     "sourceMaps": false,
      "outDir": null
    }
...
}
```

???
* Stop on startup immediately
* preLaunchTask (if you have a build task like babel)
  * Won't go into that here
* Sourcemaps!

&rarr; With that setup let's check some of the other features

---