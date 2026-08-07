import ProfilePage from '../../components/profile/ProfilePage.jsx';
import { defaultProfile } from '../../data/profile.js';

export const metadata = {
  title: 'Profile | KAIwa',
};

export default function ProfileRoute() {
  return <ProfilePage profile={defaultProfile} />;
}
