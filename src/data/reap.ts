import { Devvit } from '@devvit/public-api'

Devvit.configure({
    redditAPI: true,
})

Devvit.addTrigger({
    event: 'PostSubmit',
    onEvent: async (event, context) => {
    const post = await context.reddit.getPostById(event.post!.id);
    console.log(`New post detected: ${post.title}`);

    },
});

Devvit.addTrigger({
    event: 'CommentSubmit',
    onEvent: async (event, context) => {
        const comment = await context.reddit.getCommentById(event.comment!.id);
        // const author = await context.reddit.getUserById(event.author!.id);
        console.log(`New comment by ${event.author?.name}: ${comment?.body}`);
    },
});