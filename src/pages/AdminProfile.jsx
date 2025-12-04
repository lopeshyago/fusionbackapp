import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, User, Image as ImageIcon } from 'lucide-react';
import { useOptimizedNavigation } from "../components/common/NavigationHelper";

export default function AdminProfile() {
  const { navigateTo } = useOptimizedNavigation();
  const [form, setForm] = useState({ full_name: '', phone: '', avatar_url: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { User } = await import('@/api/entities_new');
        const me = await User.me();
        const initial = {
          full_name: me?.full_name || '',
          phone: me?.phone || '',
          avatar_url: me?.avatar_url || ''
        };
        setForm(initial);
        setAvatarPreview(initial.avatar_url || '');
      } catch (e) {
        setError('Falha ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(''); setOk('');
    try {
      const { User } = await import('@/api/entities_new');
      if (avatarFile) {
        try {
          const { localApi } = await import('@/api/localApi');
          const up = await localApi.uploadFile(avatarFile);
          if (up?.url) {
            form.avatar_url = up.url;
          }
        } catch (e) { console.error('Falha no upload do avatar', e); }
      }
      await User.updateMyUserData(form);
      setOk('Perfil atualizado com sucesso.');
    } catch (e) {
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { User } = await import('@/api/entities_new');
      await User.logout();
    } catch {}
    navigateTo('Index', {}, true);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <span className="text-xl font-bold">Meu Perfil (Admin)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateTo('AdminDashboard')} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Dados do Administrador</CardTitle>
            <CardDescription>Edite suas informações básicas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm">{error}</div>}
            {ok && <div className="p-3 bg-green-100 border border-green-200 text-green-700 text-sm">{ok}</div>}
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} className="border-orange-200" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="border-orange-200" />
            </div>
            <div className="space-y-2">
              <Label>Foto do Perfil</Label>
              {avatarPreview && (
                <img src={avatarPreview} alt="Prévia do avatar" className="h-24 w-24 rounded-full object-cover mb-2 border" />
              )}
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files?.[0] || null;
                  setAvatarFile(f);
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setAvatarPreview(url);
                  } else {
                    setAvatarPreview(form.avatar_url || '');
                  }
                }} className="border-orange-200" />
                <Button type="button" variant="outline" onClick={() => { setAvatarFile(null); setAvatarPreview(form.avatar_url || ''); }}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar' }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
