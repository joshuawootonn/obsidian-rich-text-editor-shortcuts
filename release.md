To create a new release

-   [] Update the package.json
-   [] Update the manifest.json
-   [] Run this with the new version

    ```
    git tag -a 1.0.1 -m "1.0.1"
    git push origin 1.0.1
    ```

There is a release action that will create a release for you.
