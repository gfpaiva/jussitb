# jussitb
CLI Utils for auto deploy files and templates on VTEX CMS

## Installation
Install globally with npm or yarn

```bash
$ npm install -g jussitb
```

or

```bash
$ yarn global add jussitb
```

## Usage
After build with *gulp deploy* your project, open the terminal in root path of your project and run:

```bash
$ jussitb deploy
```

Provide your email and account name to login, after wait the upload processes.

## jussitb.lock.json
The process will generate a jussitb.lock.json file in root path of your project.
This file is used to cache files and prevent upload files with same content, we recomend to not delete or ignore this file.

## Extra
Other utils commands:

*Help*
```bash
$ jussitb -h
```

*Deploy auto provide account and email*
```bash
$ jussitb deploy --account <accountName> --email <email>
```

*Force update all files ignoring lockfile*
```bash
$ jussitb deploy --force
```

*Deploy Template Files*
```bash
$ jussitb html
```

*Deploy SubTemplate Files*
```bash
$ jussitb sub
```

*Deploy ShelvesTemplate Files*
```bash
$ jussitb shelf
```

*Deploy Assets Files*
```bash
$ jussitb assets
```