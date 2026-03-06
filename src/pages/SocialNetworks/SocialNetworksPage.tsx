import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SocialConnections from "../../components/UserProfile/SocialConnections";

export default function SocialNetworksPage() {
    return (
        <>
            <PageMeta
                title="Redes Sociais | Miggo"
                description="Conecte e gerencie suas redes sociais"
            />
            <PageBreadcrumb pageTitle="Redes Sociais" />

            <div className="max-w-2xl">
                <SocialConnections />
            </div>
        </>
    );
}
