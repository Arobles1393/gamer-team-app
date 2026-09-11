import { Routes, Route } from "react-router-dom";
import { PostList, PostDetail } from "../components/Posts";
import { Profile } from "../components/Profile";
import { ChatPage } from "../components/Chat";
import { Notifications } from "../components/Notifications";
import { Friends } from "../components/Friends";
import FindPlayers from "../components/FindPlayers";
import { GamingNews } from "../components/GamingNews";

const AppRoutes = ({
	user,
	userData,
	setEditingPost,
	setShowCreatePost
}) => {

	return (
		<Routes>
			<Route
				path="/"
				element={
					<PostList user={user} 
						userData={userData}
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
					/>
				}
			/>
			<Route
				path="/profile"
				element={
					<Profile user={user} 
						userData={userData} 
					/>
				}
			/>
			<Route
				path="/myposts"
				element={
					<PostList user={user} 
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
						onlyMine
					/>
				}
			/>
			<Route
				path="/mypartys"
				element={
					<PostList user={user}
						setShowCreatePost={setShowCreatePost}
						joined
					/>
				}
			/>
			<Route
				path="/chat"
				element={
					<ChatPage user={user}/>
				}
			/>
			<Route
				path="/post/:id" 
				element={
					<PostDetail user={user} userData={userData}/>
				}
			/>
			<Route
				path="/notifications"
				element={<Notifications user={user} />}
			/>
			<Route
				path="/friends"
				element={<Friends user={user} userData={userData}/>}
			/>
			<Route
				path="/findPlayers"
				element={<FindPlayers user={user} userData={userData}/>}
			/>
			<Route
				path="/news"
				element={<GamingNews />}
			/>
		</Routes>
	);

};

export default AppRoutes;