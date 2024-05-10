
const labelColor = '0052CD';

const currentLabels = await github.rest.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
})

// filter by color to get services' label
const currentServiceLabelNames = currentLabels.data.filter(label => label.color === labelColor).map(label => label.name);

const releases = await github.paginate(github.rest.repos.listReleases, {
    owner: context.repo.owner,
    repo: context.repo.repo,
});

// TODO: filter currentServiceLabelNames を含む draft の PR が欲しい。
const draftReleases = releases.data.filter(release => release.draft && currentServiceLabelNames.includes(release.name));

const servicesToCreate = currentServiceLabelNames.filter(serviceName => draftReleases.find(release => release.name === serviceName) === undefined)
const prTitle = context.payload.pull_request.title;
const prNumber = context.payload.pull_request.number;

console.log("draftReleases", draftReleases);
console.log("currentServiceLabelNames", currentServiceLabelNames);
console.log("servicesToCreate", servicesToCreate);
console.log("prTitle", prTitle);
console.log("prNumber", prNumber);
return;
// update draft release
for (const draftRelease of draftReleases) {
    const body = `${draftRelease.body}\n- ${prTitle} (#${prNumber})`;
    await github.rest.repos.updateRelease({
        owner,
        repo,
        release_id: draftRelease.id,
        body
    });
}

// Create new draft
for (const service of servicesToCreate) {
    const body = `${prTitle} (#${prNumber})`;

    await github.rest.repos.createRelease({
        owner,
        repo,
        // tag_name: "draft-" + new Date().toISOString(), draft ならたぶんタグなしで作れる？ なければ自動生成？
        name: service,
        body: body,
        draft: true
    });
}
