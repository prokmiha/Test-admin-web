import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, Send } from 'lucide-react';
import { toast } from 'sonner';

const TELEGRAM_BOT_NAME = process.env.REACT_APP_TELEGRAM_BOT_NAME || '';

export default function Login() {
  const { loginWithTelegram } = useAuth();
  const widgetRef = useRef(null);
  const [stubMode] = useState(!TELEGRAM_BOT_NAME);

  useEffect(() => {
    if (!TELEGRAM_BOT_NAME || !widgetRef.current) return;
    if (widgetRef.current.querySelector('iframe')) return;

    window.onTelegramAuth = async (tgUser) => {
      try {
        await loginWithTelegram(tgUser);
        toast.success('Авторизация успешна');
      } catch {
        toast.error('Ошибка авторизации');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    widgetRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [loginWithTelegram]);

  const handleStubLogin = async () => {
    const stubUser = {
      id: 123456789,
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin_stub',
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'stub_hash_not_verified',
    };

    try {
      await loginWithTelegram(stubUser);
      toast.success('Вход выполнен (тестовый режим)');
    } catch {
      toast.error('Ошибка авторизации');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#6200ee] flex items-center justify-center">
            <Package className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold font-['Manrope']">
            Admin Panel
          </CardTitle>
          <CardDescription className="text-base">
            Войдите через Telegram для доступа к панели управления
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6 pb-8">
          {stubMode ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 w-full">
                <p className="font-medium mb-1">Тестовый режим</p>
                <p>
                  Переменная <code className="bg-amber-100 px-1 rounded">REACT_APP_TELEGRAM_BOT_NAME</code> не задана.
                  Виджет Telegram недоступен — используется вход-заглушка.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white gap-2"
                onClick={handleStubLogin}
              >
                <Send className="w-5 h-5" />
                Войти (тестовый режим)
              </Button>
            </div>
          ) : (
            <div ref={widgetRef} className="flex justify-center min-h-[48px]" />
          )}

          <p className="text-xs text-slate-400 text-center max-w-xs">
            Для авторизации используется официальный{' '}
            <a
              href="https://core.telegram.org/widgets/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6200ee] hover:underline"
            >
              Telegram Login Widget
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
