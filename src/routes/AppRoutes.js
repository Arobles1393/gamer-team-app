import { Routes, Route } from "react-router-dom";
import { PostList, PostFeed, PostDetail, ExplorePage } from "../components/Posts";
import { Profile } from "../components/Profile";
import { ChatPage } from "../components/Chat";
import { Notifications } from "../components/Notifications";
import { Friends } from "../components/Friends";
import { FindPlayers } from "../components/FindPlayers";
import { GamingNews } from "../components/GamingNews";
import { NotFound } from "../components/NotFound";
import { AdminReports } from "../components/Admin";
import RequireAuth from "./RequireAuth";
import RequireAdmin from "./RequireAdmin";

const AppRoutes = ({
	setEditingPost,
	setShowCreatePost
}) => {

	return (
		<Routes>
			<Route
				path="/"
				element={
					<PostFeed
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
					/>
				}
			/>
			<Route
				path="/profile"
				element={
					<RequireAuth>
						<Profile />
					</RequireAuth>
				}
			/>
			<Route
				path="/myposts"
				element={
					<RequireAuth>
						<PostList
							setEditingPost={setEditingPost}
							setShowCreatePost={setShowCreatePost}
							onlyMine
						/>
					</RequireAuth>
				}
			/>
			<Route
				path="/myparties"
				element={
					<RequireAuth>
						<PostList
							setShowCreatePost={setShowCreatePost}
							joined
						/>
					</RequireAuth>
				}
			/>
			<Route
				path="/chat"
				element={
					<RequireAuth>
						<ChatPage />
					</RequireAuth>
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
				element={
					<RequireAuth>
						<Notifications />
					</RequireAuth>
				}
			/>
			<Route
				path="/friends"
				element={
					<RequireAuth>
						<Friends />
					</RequireAuth>
				}
			/>
			<Route
				path="/findPlayers"
				element={
					<RequireAuth>
						<FindPlayers />
					</RequireAuth>
				}
			/>
			<Route
				path="/explorar"
				element={
					<ExplorePage
						setEditingPost={setEditingPost}
						setShowCreatePost={setShowCreatePost}
					/>
				}
			/>
			<Route
				path="/news"
				element={<GamingNews />}
			/>
			{/* Admin: sin enlace en ningún menú */}
			<Route
				path="/admin/reports"
				element={
					<RequireAdmin>
						<AdminReports />
					</RequireAdmin>
				}
			/>
			<Route
				path="*"
				element={<NotFound />}
			/>
		</Routes>
	);

};

export default AppRoutes;