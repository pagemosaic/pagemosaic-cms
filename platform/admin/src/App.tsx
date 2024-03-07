import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import {SignUpRoute, signUpAction} from '@/roots/auth/SignUp.route';
import {LoginRoute, loginAction} from '@/roots/auth/Login.route';
import {MainRoute, mainLoader, mainAction} from '@/roots/main/Main.route';
import {PasswordRecoveryRoute, passwordRecoveryAction} from '@/roots/auth/PasswordRecovery.route';
import {PasswordResetConfirmRoute} from '@/roots/auth/PasswordResetConfirm.route';
import {PasswordResetRoute, passwordResetAction} from '@/roots/auth/PasswordReset.route';
import {PagesRoute} from '@/features/pages/Pages.route';
import {pagesLoader, allPagesLoaderGuard} from '@/features/pages/pages.loader';
import {EditPageRoute} from '@/features/editPage/EditPage.route';
import {editPageAction} from '@/features/editPage/editPage.action';
import {editPageLoader, editPageLoaderGuard} from '@/features/editPage/editPage.loader';
import {filesFinderLoader, filesFinderLoaderGuard} from '@/features/filesFinder/filesFinder.loader';
import {FilesFinderRoute} from '@/features/filesFinder/FilesFinder.route';
import {filesFinderAction} from '@/features/filesFinder/filesFinder.action';
import {pagesAction} from '@/features/pages/pages.action';
import {DashboardRoute} from '@/features/dashboard/Dashboard.route';
import {dashboardLoader} from '@/features/dashboard/dashboard.loader';
import {editDomainLoader, editDomainLoaderGuard} from '@/features/editDomain/editDomain.loader';
import {EditDomainRoute} from '@/features/editDomain/EditDomain.route';
import {editDomainAction} from '@/features/editDomain/editDomain.action';
import {ErrorBoundary} from '@/components/utils/ErrorBoundary';
import {GalleryRoute} from '@/features/gallery/Gallery.route';
import {galleryLoader} from '@/features/gallery/gallery.loader';

const router = createBrowserRouter([
    {
        id: 'main',
        path: '/',
        element: <MainRoute />,
        errorElement: <ErrorBoundary />,
        loader: mainLoader,
        action: mainAction,
        children: [
            {
                path: '',
                index: true,
                loader: dashboardLoader,
                element: <DashboardRoute />
            },
            {
                path: 'pages',
                element: <PagesRoute />,
                action: pagesAction,
                loader: pagesLoader,
                shouldRevalidate: allPagesLoaderGuard
            },
            {
                path: 'edit-domain',
                loader: editDomainLoader,
                action: editDomainAction,
                shouldRevalidate: editDomainLoaderGuard,
                element: <EditDomainRoute />
            },
            {
                path: 'edit-page/:pageId',
                element: <EditPageRoute />,
                action: editPageAction,
                loader: editPageLoader,
                shouldRevalidate: editPageLoaderGuard
            },
            {
                path: 'files',
                action: filesFinderAction,
                loader: filesFinderLoader,
                shouldRevalidate: filesFinderLoaderGuard,
                element: <FilesFinderRoute />
            },
            {
                path: 'gallery',
                loader: galleryLoader,
                element: <GalleryRoute />
            }
        ]
    },
    {
        path: '/sign-up',
        action: signUpAction,
        element: <SignUpRoute />
    },
    {
        path: '/login',
        action: loginAction,
        element: <LoginRoute />
    },
    {
        path: '/password-reset',
        action: passwordResetAction,
        element: <PasswordResetRoute />
    },
    {
        path: '/password-reset-confirm',
        element: <PasswordResetConfirmRoute />
    },
    {
        path: '/password-recovery',
        action: passwordRecoveryAction,
        element: <PasswordRecoveryRoute />
    }
], {basename: '/admin'});

if (import.meta.hot) {
    import.meta.hot.dispose(() => router.dispose());
}

export function App() {
    return (
        <RouterProvider
            router={router}
        />
    );
}
