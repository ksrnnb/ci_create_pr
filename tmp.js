const service = context.payload.inputs.service;
const versionType = context.payload.inputs.versionType;

console.log("service", service);
console.log("versionType", versionType);

// paginate method get all data
// https://docs.github.com/ja/rest/using-the-rest-api/using-pagination-in-the-rest-api?apiVersion=2022-11-28#example-using-the-octokitjs-pagination-method
const releases = await github.paginate(github.rest.repos.listReleases, {
    owner: context.repo.owner,
    repo: context.repo.repo,
});

const latestRelease = releases.find(release => !release.draft && release.name.includes(service));
const draftRelease = releases.find(release => release.draft && service === release.name);

console.log("latestRelease", latestRelease);
console.log("draftRelease", draftRelease);

if (!latestRelease && !draftRelease) {
    console.error("Both latest release and draft release are not found.");
    return;
}

let newVersion;
let oldTagName;

if (!latestRelease) {
    // if this is first release, base version is "0.0.0"
    newVersion = nextVersion("0.0.0", versionType);
} else {
    const latestVersion = latestRelease.tag_name.split("/").at(2);
    if (!latestVersion) {
        throw Error(`latest version cannot be got from tag ${latestRelease.tag_name}`);
    }
    newVersion = nextVersion(latestVersion, versionType);
}

const newTagName = `microservices/${service}/${newVersion}`;

if (!draftRelease) {
    await github.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: newTagName,
        name: newTagName,
        body: `there is no difference between previous release ${latestRelease?.tag_name} and \`${newTagName}\``,
        draft: false
    });
    return;
}

await github.rest.repos.updateRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: draftRelease.id,
    tag_name: newTagName,
    name: newTagName,
    draft: false
});

const nextVersion = (currentVersion, versionType) => {
    const versions = currentVersion.split(".");
    if (versions.length !== 3) {
        throw Error(`version has unexpected format ${currentVersion}, expected format is like "x.y.z"`);
    }

    const intVersions = versions.map(version => Number(version));
    switch (versionType) {
        case "major":
            intVersions[0]++;
            break;
        case "minor":
            intVersions[1]++;
            break;
        case "patch":
            intVersions[2]++;
            break;
    }

    return intVersions.join(".");
}