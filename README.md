# dashboard_android_build

Public, manual Android APK builder for the private
[`andless-tech/dashboard_android`](https://github.com/andless-tech/dashboard_android)
repository.

## Build an APK

1. Open the **Actions** tab.
2. Select **Build Android APK**.
3. Click **Run workflow**.
4. Enter a source branch, tag, or commit (the default is `main`) and choose
   `release` or `debug`.
5. When the job finishes, download the APK from the run's **Artifacts** section.

The workflow can only read the private source repository through a dedicated
read-only deploy key. It does not publish source code or commit build outputs to
this repository. Build artifacts are retained for 14 days.
