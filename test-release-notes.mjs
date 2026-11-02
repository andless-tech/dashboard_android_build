import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const workflow = readFileSync(new URL('./.github/workflows/build-android.yml', import.meta.url), 'utf8')
const step = workflow.match(/- name: Read canonical release notes\n([\s\S]*?)\n      - name:/)[1]
assert(step.includes("if: inputs.build_mode == 'release'"))
const validation = step.split('        run: |\n')[1].split('\n').map((line) => line.replace(/^          /, '')).join('\n')
const manifestCommand = 'jq -n \\\n' + workflow.split('          jq -n \\\n')[1].split(' > "$manifest"')[0].replaceAll('${{ inputs.force_update }}', 'false') + ' > "$manifest"'
const dir = mkdtempSync(join(tmpdir(), 'android-release-notes-'))
try {
  mkdirSync(join(dir, 'bin'))
  // Exercise the actual workflow shell without HTTP, APK builds or OSS writes.
  writeFileSync(join(dir, 'bin/curl'), '#!/bin/bash\nwhile [[ $# -gt 0 ]]; do if [[ "$1" == "--output" ]]; then cp "$FIXTURE" "$2"; exit; fi; shift; done\nexit 1\n', { mode: 0o755 })
  const notes = { force: false, app: 'dashboard-android', channel: 'release', version: '0.0.60', changelog: '改善画面\n优化操控', release_notes_url: 'https://www.andless.tech/changelog/android/0.0.60/' }
  const env = { ...process.env, PATH: join(dir, 'bin') + ':' + process.env.PATH, RUNNER_TEMP: dir, RELEASE_VERSION: notes.version, FORCE_UPDATE: 'false', FIXTURE: join(dir, 'fixture.json'), SOURCE_COMMIT: 'a'.repeat(40), build_time: '2026-11-02T00:00:00Z', versioned_key: 'test/app.apk', apk_sha256: 'b'.repeat(64), apk_size: '123', manifest: join(dir, 'manifest.json') }
  const run = (script) => spawnSync('bash', ['-c', script], { env, encoding: 'utf8' })
  writeFileSync(env.FIXTURE, JSON.stringify(notes))
  const valid = run(validation)
  assert.equal(valid.status, 0, valid.stderr)
  const built = run(manifestCommand)
  assert.equal(built.status, 0, built.stderr)
  const manifest = JSON.parse(readFileSync(env.manifest, 'utf8'))
  assert.equal(manifest.changelog, notes.changelog)
  assert.equal(manifest.release_notes_url, notes.release_notes_url)
  assert.equal(manifest.force, false)
  assert.equal(manifest.artifacts.android.sha256, env.apk_sha256)
  assert.equal(manifest.device_requirements.minimum_firmware, '1.0.13')
  for (const change of [{ force: true }, { app: 'dashboard' }, { version: '0.0.59' }, { channel: 'debug' }, { changelog: '' }, { changelog: '中'.repeat(6000) }, { release_notes_url: 'https://other.example/' }]) {
    writeFileSync(env.FIXTURE, JSON.stringify({ ...notes, ...change }))
    assert.notEqual(run(validation).status, 0, JSON.stringify(change))
  }
  writeFileSync(env.FIXTURE, JSON.stringify({ ...notes, version: 'wrong' }) + '\n' + JSON.stringify(notes))
  assert.notEqual(run(validation).status, 0)
  console.log('Canonical Android notes: workflow validation, manifest merge and debug exclusion passed')
} finally { rmSync(dir, { recursive: true, force: true }) }
