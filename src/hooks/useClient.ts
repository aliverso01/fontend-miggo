import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';

export const useClient = () => {
    const { user } = useAuthContext();
    const [clientId, setClientId] = useState<number | null>(() => {
        const storedId = localStorage.getItem(`client_id_${user?.id}`);
        return storedId ? parseInt(storedId, 10) : null;
    });
    const [loading, setLoading] = useState(!clientId && !!user);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClient = async () => {
            if (user?.id && !clientId) {
                setLoading(true);
                try {
                    const response = await fetch("/api/v1/client/list/", {
                        headers: { Authorization: import.meta.env.VITE_MIGGO_API_KEY },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const myClient = data.find((c: any) => c.user === user.id);
                        if (myClient) {
                            setClientId(myClient.id);
                            localStorage.setItem(`client_id_${user.id}`, String(myClient.id));
                        } else {
                            setError("Client record not found for user.");
                        }
                    } else {
                        setError("Failed to fetch clients.");
                    }
                } catch (e: any) {
                    console.error("Failed to fetch client for user", e);
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        if (user?.role === 'client') {
            fetchClient();
        } else {
            setLoading(false);
        }
    }, [user, clientId]);

    return { clientId, loading, error };
};
