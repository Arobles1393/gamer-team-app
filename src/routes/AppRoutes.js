import { Routes, Route } from "react-router-dom";
import { PostList, PostDetail } from "../components/Posts";
import { Profile } from "../components/Profile";
import { ChatPage } from "../components/Chat";
import { Notifications } from "../components/Notifications";
import { Friends } from "../components/Friends";
import { FindPlayers } from "../components/FindPlayers";
import { GamingNews } from "../components/GamingNews";
import { NotFound } from "../components/NotFound";

const AppRoutes = ({
	setEditingPost,
	setShowCreatePost
}) => {

	return (
		<Routes>
			<Route
				path="/"
				element={
					<PostList
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
					/>
				}
			/>
			<Route
				path="/profile"
				element={
					<Profile />
				}
			/>
			<Route
				path="/myposts"
				element={
					<PostList
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
						onlyMine
					/>
				}
			/>
			<Route
				path="/myparties"
				element={
					<PostList
						setShowCreatePost={setShowCreatePost}
						joined
					/>
				}
			/>
			<Route
				path="/chat"
				element={
					<ChatPage />
				}
			/>
			<Route
				path="/post/:id" 
				element={
					<PostDetail
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
					/>
				}
			/>
			<Route
				path="/notifications"
				element={<Notifications />}
			/>
			<Route
				path="/friends"
				element={<Friends />}
			/>
			<Route
				path="/findPlayers"
				element={<FindPlayers />}
			/>
			<Route
				path="/news"
				element={<GamingNews />}
			/>
			<Route
				path="*"
				element={<NotFound />}
			/>
		</Routes>
	);

};

export default AppRoutes;