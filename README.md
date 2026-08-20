# dashboard_android_build

Public, manual Android APK builder for the private
[`andless-tech/dashboard_android`](https://github.com/andless-tech/dashboard_android)
repository.

## Build an APK

1. Open the **Actions** tab.
2. Select **Build Android APK**.
3. Click **Run workflow**.
4. Enter a source branch, tag, or commit (the default is `main`).
5. Enter a version Tag in `vMAJOR.MINOR.PATCH` format, such as `v0.0.27`, and
   choose `release` or `debug`.
6. When the job finishes, download the APK from the run's **Artifacts** section.

Release builds embed `MAJOR.MINOR.PATCH` as Android `versionName` and use the
monotonically increasing Actions run number as Android `versionCode`. After a
successful release build, the workflow:

- uploads an immutable copy to
  `oss://quic-console-ota/dashboard-android/release/versions/vMAJOR.MINOR.PATCH/app-release.apk`;
- writes the matching immutable `manifest.json` beside the versioned APK;
- replaces `oss://quic-console-ota/dashboard-android/release/latest.json`;
- creates the matching version Tag in this build repository.

The maintenance workflow **Backfill Android Version Manifests** regenerates and
verifies `manifest.json` for every existing APK under
`dashboard-android/release/versions/`.

The OSS upload requires the repository Actions secrets `OSS_ACCESS_KEY_ID` and
`OSS_ACCESS_KEY_SECRET`. The associated RAM identity should only have the OSS
permissions needed to write the two `release/` object prefixes.

The workflow can only read the private source repository through a dedicated
read-only deploy key. It does not publish source code or commit build outputs to
this repository. Build artifacts are retained for 14 days.
