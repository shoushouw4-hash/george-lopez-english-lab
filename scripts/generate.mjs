// The Prisma 7 client uses the JS driver adapter, not a native engine.
// Point the unused schema-engine selector at an existing failing executable so
// generate does not download an engine that is never executed. All SQL migrations
// are applied by init-db.mjs; native Prisma migrate commands are not used here.
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['node_modules/prisma/build/index.js','generate'],{stdio:'inherit',env:{...process.env,PRISMA_SCHEMA_ENGINE_BINARY:process.platform==='win32'?process.execPath:'/bin/false'}});
