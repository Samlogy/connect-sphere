import { Application, Router } from "express";
import controller from "./controllers";


/* Routes */
const UserServiceRoutes = (route: string, app: Application) => {
    const router = Router();

    // User
    router.post("/register", controller.user.register);
    router.post("/login", controller.user.login);

    // Profile
    router.get('/:id', controller.user.getUserProfile);
    router.put('/:id', controller.follow.updateUserProfile);

    // Follow
    router.post('/follow', controller.follow.followUser);
    router.post('/unfollow', controller.follow.unfollowUser);
    router.get('/:id/followers', controller.follow.getFollowers);
    router.get('/:id/following', controller.follow.getFollowing);

    app.use(route, router);
}


export default {
    UserServiceRoutes
}