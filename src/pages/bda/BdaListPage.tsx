import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient'; // adjust path if needed
import toast from 'react-hot-toast';

type Profile = {
  id: string;
  email: string;
  role: string;
  // Add more fields as per your table schema
};

function BdaListPage() {
  const [bdaProfiles, setBdaProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles:', error.message);
        toast.error('Failed to load profiles');
        return;
      }

      console.log('Fetched profiles:', data);
      setBdaProfiles(data || []);
    };

    fetchProfiles();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Profiles</h1>
      {bdaProfiles.length === 0 ? (
        <p>No profiles found.</p>
      ) : (
        <ul className="space-y-2">
          {bdaProfiles.map((profile) => (
            <li
              key={profile.id}
              className="p-4 border rounded bg-gray-50 shadow-sm"
            >
              <p><strong>ID:</strong> {profile.id}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BdaListPage;
