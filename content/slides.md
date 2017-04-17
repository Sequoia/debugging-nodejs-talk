class: title
# Debugging Node.js

## Sequoia McDowell

* 🌐  http://sequoia.makes.software
* 🦆  @_sequoia
* 📧  sequoia.mcdowell@gmail.com

???

## Welcoming to debugging Node.js!

* I'm Sequoia, find me online at x, y, z
* I've been writing Node.js since v0.3
* Come a long way since then
* Worked in Java for a bit
  * Code hinting
  * Step thru debugging
  * Robust logging
  * *Missed this when I returned to node*

&rarr; Going to talk about how to do this stuff in node.js

---
class: biglist

# Agenda

--

* Logging
???
----
* enabling & disabling logs
* writing to other log systems
--

* IDE Integrations
???
----
* Type hinting
* Linting & problem finding
* Running project tasks
--

* Step-Through Debugging
???
----
* step through debugging
* Breakpoints
--

* Advanced Debugging
???
----
* CPU analysis
* Tracking timing from browser
* heap dump analysis

---

# Logging

???
* What to log
* What tools are available
* Enabling & disabling logging

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

## ℹ️ Throw `Error` Objects

--

### ❌

```js
try{
  throw "something went wrong!";
}catch(e){
  console.error(e.stack); // undefined!! :(
}
```

???
* no stack

--

### ✅

```js
try{
  throw new Error('something went wrong!');
}catch(e){
  console.error(e.stack); 
}                         
// Error: something went wrong!
//     at Object.<anonymous> (/Users/sequoia/tmp/test-app/app.js:16:11)
//     at Module._compile (module.js:541:32)
//     ...
```

???
* With stack trace!

"A JavaScript **exception** is a **value that is thrown** as a result of an invalid operation or as the target of a throw statement. While it is not required that these values are instances of Error or classes which inherit from Error, **all exceptions thrown by Node.js or the JavaScript runtime will be instances of Error**."


---

## ℹ️ Name Functions

### ❌ Anonymous Functions
```js
db.connect(config, function(connection){ /*...*/})
connection.findAll(function(results){ /*...*/})
fs.read(filename, function(err, results){ /*...*/})
```

--

### ✅ Named Functions
```js
db.connect(config, function dbReady(connection){ /*...*/})
Users.findAll(function handleResults(results){ /*...*/})
fs.read(filename, function processFiles(err, results){ /*...*/})
```

---

## ℹ️ Name Functions

### ❌ Anonymous Functions
```no-highlight
Uncaught TypeError: Cannot read property 'name' of undefined
  getUser              @ foo.js:2
  (anonymous function) @ bar.js:71
  (anonymous function) @ bar.js:202
  (anonymous function) @ baz.js:11
  ...
```

--

### ✅ Named Functions
```no-highlight
Uncaught Error:
  getUser              @ foo.js:2
  getItem              @ bar.js:71
  buildDBQuery         @ bar.js:202
  createDatabase       @ baz.js:11
  ...
```
 <!-- .element: class="fragment" -->


---

## ℹ️  Use `assert`

### ❌

```js
if(!cfg.host){
  throw new Error('host must be set');
}
if(typeof cfg.port !== 'number'){
  throw new Error('port must be a number');
}
```

--
### ✅

```js
const assert = require('assert');

assert(cfg.host, 'host must be set');
assert.equal(typeof cfg.port, 'number'), 'port must be a number');
```

???

* Like asserts in java!
* Makes error with stack trace + optional message

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

* `EACCES`
* `EADDRINUSE`
* `ECONNREFUSED`
* `ECONNRESET`
* etc.

---

## `error.code`

```js
fs.readFile(filename, function(err, data){
  if(err){
    if (err.code === 'EACCES'){
      response.statusCode = '403';
      response.statusMessage = 'Access Denied!!';
    }
    if (err.code === 'ENOENT'){
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

# Console Logging

```js
console.log('looking up user {id: %s}', id);
db.Users.find({id: id}, function(e, user){
  console.log('found user %s: %s', user.id, user.name);
})
```
```js
app.get('/posts/:id', function handleIndex(req, res){
  console.log('post %s requested', req.params.id);
})
app.get('/users/:id', function handleIndex(req, res){
  console.log('user %s requested', req.params.id);
})
```
```js
db.on('query', function(query){
  console.log('querying database: %s', query.query);
})
```

???

While you're working you add console statements like this

---

# Console Logging

```js
//...
db.Users.find({id: id}, function(e, user){
  //...
})
```
```js
app.get('/posts/:id', function handleIndex(req, res){
  //...
})
app.get('/users/:id', function handleIndex(req, res){
  //...
})
```
```js
db.on('query', function(query){
  //...
})
```

???
Then you stop working on that stuff so you delete your console.log statements

---

# Console Logging

```js
//console.log('looking up user {id: %s}', id);
db.Users.find({id: id}, function(e, user){
  //console.log('found user %s: %s', user.id, user.name);
})
```
```js
app.get('/posts/:id', function handleIndex(req, res){
  //console.log('post %s requested', req.params.id);
})
app.get('/users/:id', function handleIndex(req, res){
  //console.log('user %s requested', req.params.id);
})
```
```js
db.on('query', function(query){
  //console.log('querying database: %s', query.query);
})
```

???
But later you need them, so you add them back

this time you just **comment them out**

&rarr; There's got to be a better way!

---

# The `debug` module

```no-highlight
$ npm install --save debug
```

--

```js
const debug = require('debug');
const log = debug('my-app');
```

```js
log('test');

setTimeout(function(){
  log('user: %j', { id: 12, name: 'Naomi' });
}, 500)
```

--

----

<pre class="ansi2html">
bash-3.2$ node script.js
</pre>

--

----

<pre class="ansi2html">
bash-3.2$ <span class="b4">DEBUG=*</span> node script.js
--

  <span class="f3"><span class="bold">my-app </span></span>test <span class="f3">+0ms</span>
  <span class="f3"><span class="bold">my-app </span></span>user: {&quot;id&quot;:12,&quot;name&quot;:&quot;Naomi&quot;} <span class="f3">+503ms</span>
</pre>

???

one of the first things I install on a new project

**Note the environmental variable**

---

## Using `debug`

```js
log('looking up user {id: %s}', id);
db.Users.find({id: id}, function(e, user){
  log('found user %s: %s', user.id, user.name);
})
```
```js
app.get('/posts/:id', function handleIndex(req, res){
  log('post %s requested', req.params.id);
})
//...
```
--

<pre class="ansi2html">
bash-3.2$ <span class="b4">DEBUG=my-app</span> script.js
--

  <span class="f3"><span class="bold">my-app </span></span>looking up user {id: 123} <span class="f3">+96ms</span>
  <span class="f3"><span class="bold">my-app </span></span>querying database: SELECT * FROM `Users` WHERE `User.id`=123 <span class="f3">+6ms</span>
  <span class="f3"><span class="bold">my-app </span></span>found user 123: Naomi <span class="f3">+108ms</span>
  <span class="f3"><span class="bold">my-app </span></span>post best-frameworks-2017 requested <span class="f3">+43ms</span>
  <span class="f3"><span class="bold">my-app </span></span>querying database: SELECT * FROM `Posts` WHERE `Post.slug`=&quot;best-frameworks-2017&quot;;<span class="f3">+22ms
</span>
  <span class="f3"><span class="bold">my-app </span></span>user: {&quot;id&quot;:12,&quot;name&quot;:&quot;Naomi&quot;} <span class="f3">+225ms</span>
</pre>

???

* Note timings: time since **last call**
  * `108ms` is time between logging "querying db" and getting result
* Whole application verbose-mode
* We can do better!
* &rarr; **Per-section** debugging

---

```js
const dbLog = debug('my-app:database');
const routeLog = debug('my-app:routes');
const userLog = debug('my-app:users');
```
--
```js
db.Users.find({id: id}, function(e, user){
*  userLog('found user %s: %s', user.id, user.name);
})
app.get('/posts/:id', function handleIndex(req, res){
*  routeLog('post %s requested', req.params.id);
})
db.on('query', function(query){
*  dbLog('querying database: %s', query.query);
})
```

--

<pre class="ansi2html">
bash-3.2$ <span class="b4">DEBUG=my-app:*</span> node script.js          
--

  <span class="f3"><span class="bold">my-app:routes </span></span>user 123 requested <span class="f3">+0ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>looking up user {id: 123} <span class="f6">+97ms</span>
  <span class="f2"><span class="bold">my-app:database </span></span>querying database: SELECT * FROM `Users` WHERE `User.id`=123 <span class="f2">+7ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>found user 123: Naomi <span class="f6">+109ms</span>
  <span class="f3"><span class="bold">my-app:routes </span></span>post best-frameworks-2017 requested <span class="f3">+43ms</span>
  <span class="f2"><span class="bold">my-app:database </span></span>querying database: SELECT * FROM `Posts` WHERE `Post.slug`=&quot;best-frameworks-2017&quot;; <span class="f2">+18ms</span>
</pre>

???
What if you're only debugging the Database?

---

### Just Database Logger

<pre class="ansi2html">
bash-3.2$ DEBUG=<span class="b4">my-app:database</span> node script.js          
  <span class="f2"><span class="bold">my-app:database </span></span>querying database: SELECT * FROM `Users` WHERE `User.id`=123 <span class="f2">+7ms</span>
  <span class="f2"><span class="bold">my-app:database </span></span>querying database: SELECT * FROM `Posts` WHERE `Post.slug`=&quot;best-frameworks-2017&quot;; <span class="f2">+18ms</span>
</pre>

--

### Users + Routes

<pre class="ansi2html">
bash-3.2$ DEBUG=<span class="b4">my-app:users,my-app:routes</span> node script.js          
  <span class="f3"><span class="bold">my-app:routes </span></span>user 123 requested <span class="f3">+0ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>looking up user {id: 123} <span class="f6">+97ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>found user 123: Naomi <span class="f6">+109ms</span>
  <span class="f3"><span class="bold">my-app:routes </span></span>post best-frameworks-2017 requested <span class="f3">+43ms</span>
</pre>

???

Comma separated

--

### Everything *but* database

<pre class="ansi2html">
bash-3.2$ DEBUG=my-app:*,<span class="b4">-my-app:database</span> node script.js          
  <span class="f3"><span class="bold">my-app:routes </span></span>user 123 requested <span class="f3">+0ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>looking up user {id: 123} <span class="f6">+97ms</span>
  <span class="f6"><span class="bold">my-app:users </span></span>found user 123: Naomi <span class="f6">+109ms</span>
  <span class="f3"><span class="bold">my-app:routes </span></span>post best-frameworks-2017 requested <span class="f3">+43ms</span>
</pre>

???

Minus to omit

---

## `debug` is widely used
<pre class="ansi2html">
bash-3.2$ <span class="b4">DEBUG=*</span> node script.js          
--

  <span class="f6"><span class="bold">express:application </span></span>set &quot;x-powered-by&quot; to <span class="f3">true<span class="f9"><span class="f6"> +0ms</span></span></span>
  <span class="f6"><span class="bold">express:application </span></span>set &quot;etag&quot; to <span class="f2">'weak'<span class="f9"><span class="f6"> +3ms</span></span></span>

  <span class="f2"><span class="bold">express:router </span></span>use / query<span class="f2"> +1ms</span>
  <span class="f3"><span class="bold">express:router:layer </span></span>new /<span class="f3"> +1ms</span>
  <span class="f2"><span class="bold">express:router </span></span>use / expressInit<span class="f2"> +0ms</span>
  <span class="f3"><span class="bold">express:router:layer </span></span>new /<span class="f3"> +1ms</span>

  <span class="f4"><span class="bold">express:router:route </span></span>new /<span class="f4"> +0ms</span>
  <span class="f3"><span class="bold">express:router:layer </span></span>new /<span class="f3"> +1ms</span>
  <span class="f4"><span class="bold">express:router:route </span></span>get /<span class="f4"> +0ms</span>
  <span class="f3"><span class="bold">express:router:layer </span></span>new /<span class="f3"> +0ms</span>

  <span class="f5"><span class="bold">app:info </span></span>listening on 3030<span class="f5"> +7ms</span>
  <span class="f2"><span class="bold">express:router </span></span>dispatching GET /restaurants/1<span class="f2"> +4s</span>
  <span class="f1"><span class="bold">sqlLib:query </span></span>Executing (default): SELECT `Restaurant`.`id`, `Restaurant`.`name`, `Restaurant`.`founded`, `Restaurant`.`createdAt`, `Restaurant`.`updatedAt`, `Dishes`.`id` AS `Dishes.id`, `Dishes`.`name` AS `Dishes.name`, `Dishes`.`spicy` AS `Dishes.spicy`, `Dishes`.`createdAt` AS `Dishes.createdAt`, `Dishes`.`updatedAt` AS `Dishes.updatedAt`, `Dishes`.`RestaurantId` AS `Dishes.RestaurantId` FROM `Restaurants` AS `Restaurant` LEFT OUTER JOIN `Dishes` AS `Dishes` ON `Restaurant`.`id` = `Dishes`.`RestaurantId` WHERE `Restaurant`.`id` = '1';<span class="f1"> +4s</span>
  <span class="f5"><span class="bold">app:info </span></span>Restaurant Found: "Giotto's"<span class="f5"> +2ms</span>
  <span class="f6"><span class="bold">express:view </span></span>lookup &quot;restaurant_detail.jade&quot;<span class="f6"> +198ms</span>
  <span class="f6"><span class="bold">express:view </span></span>stat &quot;/Users/sequoia/templates/restaurant_detail.jade&quot;<span class="f6"> +0ms</span>
  <span class="f6"><span class="bold">express:view </span></span>render &quot;/Users/sequoia/templates/restaurant_detail.jade&quot;<span class="f6"> +0ms</span>
</pre>

???

Turn on debugger and see what you get!

* Can also use of course app:\*,express:\* etc.

&rarr; This is a node talk but as a side-note: `debug` also works in the browser!

---

## `debug` in The Browser

![debug module used in the browser](img/debug_browser.gif);

---

## More Robust Logging: `winston`

???



* Winston!

---

---

class: todo

## IDE Stuff

* Type hinting:
  * JSDoc
  * JSONSchema
  * Typings
* Running tasks
  * setting up task runner
  * build task, running
  * background tasks
* Problem matchers
  * use babel task: SyntaxError: src/index.js: Expecting Unicode escape sequence \uXXXX (2:8)
  * maybe try using ext thing?

---

class: todo

## Step Through Debugging

* VS CODE Setting up
  * launch configuration
  * running with f5
  * breakpoints
    * conditional, count, etc.
  * call stack
  * variable
  * watch expressions


---

class: todo

## Advanced Debugging

* Node debugger
* `node --inspect`
* sourcemaps

---

class: todo

# Styling

* fixup lists (all big??)