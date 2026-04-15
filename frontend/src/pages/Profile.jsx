import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function Profile() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [passwordData, setPasswordData] = useState({ old_password: "", new_password: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchProfile = () => {
    api.get("/profile/")
      .then((res) => {
        setProfile({
          username: res.data.username || "",
          email: res.data.email || "",
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          phone_number: res.data.phone_number || "",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/profile/update/", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
      });
      setMessage("Profile updated successfully.");
      fetchProfile();
    } catch {
      setMessage("Failed to update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post("/change-password/", passwordData);
      setMessage("Password changed successfully.");
      setPasswordData({ old_password: "", new_password: "" });
    } catch {
      setMessage("Failed to change password.");
    }
  };

  if (loading) {
    return <AppLayout title="Profile"><div className="rounded-2xl bg-white p-6 shadow-sm border">Loading...</div></AppLayout>;
  }

  return (
    <AppLayout title={`Hi, ${profile.first_name || profile.username}`} subtitle="Manage your profile information and password.">
      {message ? <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">{message}</div> : null}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[2rem] bg-white shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <input type="text" name="username" value={profile.username} disabled className="w-full rounded-xl border px-4 py-3 bg-slate-100" />
            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full rounded-xl border px-4 py-3" placeholder="Email" />
            <input type="text" name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full rounded-xl border px-4 py-3" placeholder="First Name" />
            <input type="text" name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full rounded-xl border px-4 py-3" placeholder="Last Name" />
            <input type="text" name="phone_number" value={profile.phone_number} onChange={handleProfileChange} className="w-full rounded-xl border px-4 py-3" placeholder="Phone Number" />
            <button type="submit" className="rounded-xl bg-blue-600 text-white px-5 py-3 hover:bg-blue-700">Update Profile</button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input type="password" name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} className="w-full rounded-xl border px-4 py-3" placeholder="Old Password" />
            <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} className="w-full rounded-xl border px-4 py-3" placeholder="New Password" />
            <button type="submit" className="rounded-xl bg-emerald-600 text-white px-5 py-3 hover:bg-emerald-700">Change Password</button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

export default Profile;
