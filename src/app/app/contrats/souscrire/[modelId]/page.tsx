'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, Package, Check, Loader2, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit_type: string;
  packaging: string | null;
}

interface ModelProduct {
  id: string;
  price: number;
  products: Product;
}

interface ModelDate {
  delivery_date: string;
}

interface Producer {
  name: string;
}

const unitTypeLabels: Record<string, string> = {
  unit: 'unité',
  weight: 'kg',
  volume: 'litre',
  bundle: 'lot',
};

const panierSizeConfig: Record<string, { icon: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  'petit panier': {
    icon: '🥬',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    description: 'Idéal pour 1 personne (~2 kg de légumes)',
  },
  'moyen panier': {
    icon: '🧺',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-400',
    description: 'Parfait pour un couple (~4 kg de légumes)',
  },
  'grand panier': {
    icon: '🥦',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    description: 'Pour une famille (~6 kg de légumes)',
  },
};

function isPanierContract(products: ModelProduct[]): boolean {
  if (products.length < 2) return false;
  const names = products.map(mp => mp.products.name.toLowerCase());
  return names.some(n => n.includes('petit panier')) &&
         names.some(n => n.includes('grand panier'));
}

interface ContractModel {
  id: string;
  name: string;  description: string | null;
  nature: string;
  start_date: string;
  end_date: string;
  enroll_end: string | null;
  producers: Producer;
  model_products: ModelProduct[];
  model_dates: ModelDate[];
}

export default function SouscrirePage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.modelId as string;
  const supabase = createClient();

  const [model, setModel] = useState<ContractModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: review, 2: confirm, 3: success
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const fetchModel = useCallback(async () => {
    const { data } = await supabase
      .from('contract_models')
      .select(`
        id, name, description, nature, start_date, end_date, enroll_end,
        producers ( name ),        model_products ( id, price, products ( id, name, unit_type, packaging ) ),
        model_dates ( delivery_date )
      `)
      .eq('id', modelId)
      .single();

    if (data) {
      setModel(data as any);
      const products = (data as any).model_products || [];
      const q: Record<string, number> = {};
      if (isPanierContract(products)) {
        // For panier contracts, default to 0 (user must pick one)
        products.forEach((mp: any) => {
          q[mp.id] = 0;
        });
      } else {
        // Regular products: default to 1
        products.forEach((mp: any) => {
          q[mp.id] = 1;
        });
      }
      setQuantities(q);
    }
    setLoading(false);
  }, [supabase, modelId]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  const deliveryCount = model?.model_dates?.length || 0;

  const totalPerDelivery = model?.model_products?.reduce((sum, mp) => {
    return sum + mp.price * (quantities[mp.id] || 0);
  }, 0) || 0;

  const totalCost = totalPerDelivery * deliveryCount;

  const handleSubmit = async () => {
    if (!model) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Create the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          model_id: model.id,
          status: 'pending',
          total_amount: totalCost,
          signed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (contractError) throw contractError;

      // Create contract_items for each product × delivery date
      const items: { contract_id: string; product_id: string; delivery_date: string; quantity: number }[] = [];
      for (const mp of model.model_products) {
        const qty = quantities[mp.id] || 0;
        if (qty <= 0) continue;
        for (const md of model.model_dates) {
          items.push({
            contract_id: contract.id,
            product_id: mp.products.id,
            delivery_date: md.delivery_date,
            quantity: qty,
          });
        }
      }

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('contract_items')
          .insert(items);
        if (itemsError) throw itemsError;
      }

      setStep(3);
    } catch (err: any) {
      alert('Erreur: ' + (err.message || 'Une erreur est survenue'));
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Contrat introuvable</h2>
          <p className="text-red-600 mb-4">Ce contrat n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link href="/app/contrats/disponibles" className="text-green-600 font-medium hover:underline">
            ← Retour aux contrats disponibles
          </Link>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Inscription réussie !</h2>
          <p className="text-green-700 mb-6">
            Votre contrat « {model.name} » a été créé avec succès. Vous recevrez les détails de paiement prochainement.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/app/contrats"
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Voir mes contrats
            </Link>
            <Link
              href="/app/livraisons"
              className="px-6 py-3 border-2 border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              Voir mes livraisons
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/app/contrats/disponibles"
        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux contrats disponibles
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Souscrire à un contrat</h1>
        <p className="text-gray-600">
          {model.name} — {model.producers?.name}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step >= 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">1</span>
          Choix des quantités
        </div>
        <div className="h-px flex-1 bg-gray-300" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step >= 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</span>
          Confirmation
        </div>
      </div>
      {step === 1 && (
        <div className="space-y-6">
          {/* Contract info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Détails du contrat</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Période :</span>
                <span className="font-medium">{formatDate(model.start_date)} — {formatDate(model.end_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Livraisons :</span>
                <span className="font-medium">{deliveryCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Produits :</span>
                <span className="font-medium">{model.model_products?.length || 0}</span>
              </div>
            </div>
            {model.description && (
              <p className="text-gray-600 mt-4 text-sm">{model.description}</p>
            )}
          </div>
          {/* Product quantities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {isPanierContract(model.model_products || []) ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Choisissez votre taille de panier</h2>
                <p className="text-sm text-gray-500 mb-6">Sélectionnez le panier que vous recevrez à chaque livraison ({deliveryCount} livraison{deliveryCount > 1 ? 's' : ''} prévue{deliveryCount > 1 ? 's' : ''})</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...model.model_products]
                    .sort((a, b) => a.price - b.price)
                    .map((mp) => {
                      const nameKey = mp.products.name.toLowerCase();
                      const config = panierSizeConfig[nameKey] || {
                        icon: '📦',
                        color: 'text-gray-700',
                        bgColor: 'bg-gray-50',
                        borderColor: 'border-gray-400',
                        description: mp.products.packaging || '',
                      };
                      const isSelected = (quantities[mp.id] || 0) > 0;
                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => {
                            const newQ: Record<string, number> = {};
                            model.model_products.forEach((p) => {
                              newQ[p.id] = p.id === mp.id ? 1 : 0;
                            });
                            setQuantities(newQ);
                          }}
                          className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                            isSelected
                              ? `${config.borderColor} ${config.bgColor} shadow-md ring-2 ring-offset-1 ring-green-300`
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="text-3xl mb-3">{config.icon}</div>
                          <h3 className={`text-lg font-bold ${config.color}`}>{mp.products.name}</h3>
                          {mp.products.packaging && (
                            <p className="text-sm text-gray-500 mt-1">{mp.products.packaging}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-2xl font-bold text-gray-900">{mp.price.toFixed(2)}€</p>
                            <p className="text-xs text-gray-500">par livraison</p>
                          </div>
                          <div className="mt-2 text-sm font-medium text-gray-600">
                            Total : <span className="font-bold text-green-700">{(mp.price * deliveryCount).toFixed(2)}€</span>
                            <span className="text-gray-400"> / saison</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Choisissez vos quantités</h2>
                <p className="text-sm text-gray-500 mb-4">Quantité reçue à chaque livraison ({deliveryCount} livraison{deliveryCount > 1 ? 's' : ''} prévue{deliveryCount > 1 ? 's' : ''})</p>
                <div className="space-y-4">
                  {model.model_products?.map((mp) => {
                    const qty = quantities[mp.id] || 0;
                    const subtotal = mp.price * qty;
                    return (
                      <div key={mp.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{mp.products.name}</p>
                          <p className="text-sm text-gray-500">{mp.price.toFixed(2)}€ par {unitTypeLabels[mp.products.unit_type] || mp.products.unit_type || 'unité'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantities(q => ({ ...q, [mp.id]: Math.max(0, (q[mp.id] || 1) - 1) }))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
                          <button
                            onClick={() => setQuantities(q => ({ ...q, [mp.id]: (q[mp.id] || 0) + 1 }))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="w-24 text-right ml-4">
                          <p className="font-semibold text-gray-900">{subtotal.toFixed(2)}€</p>
                          <p className="text-xs text-gray-400">/ livraison</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {/* Total breakdown */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Récapitulatif du coût</h3>
            {model.model_products?.filter(mp => (quantities[mp.id] || 0) > 0).map((mp) => (
              <div key={mp.id} className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{quantities[mp.id]} × {mp.products.name}</span>
                <span>{(mp.price * (quantities[mp.id] || 0)).toFixed(2)}€ / livraison</span>
              </div>
            ))}
            <div className="border-t border-green-300 mt-3 pt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">Panier par livraison</p>
              </div>
              <p className="font-bold text-gray-900">{totalPerDelivery.toFixed(2)}€</p>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
              <span>{totalPerDelivery.toFixed(2)}€ × {deliveryCount} livraison{deliveryCount > 1 ? 's' : ''}</span>
            </div>
            <div className="border-t border-green-400 mt-3 pt-3 flex items-center justify-between">
              <p className="text-lg font-bold text-green-800">Total du contrat</p>
              <p className="text-2xl font-bold text-green-700">{totalCost.toFixed(2)}€</p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={totalPerDelivery === 0}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif de votre commande</h2>
            <div className="space-y-3">
              {model.model_products?.filter(mp => (quantities[mp.id] || 0) > 0).map((mp) => (
                <div key={mp.id} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-700">
                    {quantities[mp.id]}x {mp.products.name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {(mp.price * (quantities[mp.id] || 0)).toFixed(2)}€ / livraison
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Par livraison</span>
                <span>{totalPerDelivery.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Nombre de livraisons</span>
                <span>× {deliveryCount}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-700 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{totalCost.toFixed(2)}€</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Information :</strong> En confirmant, vous vous engagez à régler le montant total de {totalCost.toFixed(2)}€ selon les modalités de paiement du contrat. Vous pourrez régler par chèque, virement ou espèces.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Modifier
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'Confirmer mon inscription'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}