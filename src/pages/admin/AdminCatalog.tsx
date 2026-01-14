import { useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, FolderOpen, Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category,
} from '@/hooks/useCategories';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
} from '@/hooks/useProducts';

export default function AdminCatalog() {
  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Product state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Category hooks
  const { data: categories, isLoading: loadingCategories, error: categoriesError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Product hooks
  const { data: products, isLoading: loadingProducts, error: productsError } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Category handlers
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setDeleteCategoryDialogOpen(true);
  };

  const handleSubmitCategory = async (values: {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    display_order: number;
    is_active: boolean;
  }) => {
    try {
      if (selectedCategory) {
        await updateCategory.mutateAsync({ id: selectedCategory.id, ...values });
      } else {
        await createCategory.mutateAsync(values);
      }
      setCategoryDialogOpen(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      setDeleteCategoryDialogOpen(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Product handlers
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteProductDialogOpen(true);
  };

  const handleSubmitProduct = async (values: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    category_id?: string;
    image_url?: string;
    display_order: number;
    is_available: boolean;
  }) => {
    try {
      const submitData = {
        ...values,
        category_id: values.category_id || null,
      };

      if (selectedProduct) {
        await updateProduct.mutateAsync({ id: selectedProduct.id, ...submitData });
      } else {
        await createProduct.mutateAsync(submitData);
      }
      setProductDialogOpen(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct.mutateAsync(selectedProduct.id);
      setDeleteProductDialogOpen(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(price));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assortiment</h1>
          <p className="text-muted-foreground mt-1">
            Beheer categorieën en producten.
          </p>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Producten
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categorieën
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreateProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuw product
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Producten
                </CardTitle>
                <CardDescription>
                  Alle producten in je assortiment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Afb.</TableHead>
                      <TableHead>Naam</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Prijs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Laden...
                        </TableCell>
                      </TableRow>
                    ) : productsError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-destructive">
                          {(productsError as { message?: string })?.message ?? 'Fout bij laden'}
                        </TableCell>
                      </TableRow>
                    ) : products?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nog geen producten. Maak je eerste product aan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.categories?.name || '-'}
                          </TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_available ? 'default' : 'secondary'}>
                              {product.is_available ? 'Beschikbaar' : 'Niet beschikbaar'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe categorie
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Categorieën
                </CardTitle>
                <CardDescription>
                  Organiseer je producten in categorieën.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Volgorde</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCategories ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Laden...
                        </TableCell>
                      </TableRow>
                    ) : categoriesError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-destructive">
                          {(categoriesError as { message?: string })?.message ?? 'Fout bij laden'}
                        </TableCell>
                      </TableRow>
                    ) : categories?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nog geen categorieën. Maak je eerste categorie aan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell>{category.display_order}</TableCell>
                          <TableCell>
                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                              {category.is_active ? 'Actief' : 'Inactief'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialogs */}
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          category={selectedCategory}
          onSubmit={handleSubmitCategory}
          isLoading={createCategory.isPending || updateCategory.isPending}
        />

        <DeleteConfirmDialog
          open={deleteCategoryDialogOpen}
          onOpenChange={setDeleteCategoryDialogOpen}
          onConfirm={handleConfirmDeleteCategory}
          title="Categorie verwijderen"
          description="Weet je zeker dat je deze categorie wilt verwijderen? Producten in deze categorie worden niet verwijderd."
          isLoading={deleteCategory.isPending}
        />

        {/* Product Dialogs */}
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          product={selectedProduct}
          categories={categories || []}
          onSubmit={handleSubmitProduct}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />

        <DeleteConfirmDialog
          open={deleteProductDialogOpen}
          onOpenChange={setDeleteProductDialogOpen}
          onConfirm={handleConfirmDeleteProduct}
          title="Product verwijderen"
          description="Weet je zeker dat je dit product wilt verwijderen?"
          isLoading={deleteProduct.isPending}
        />
      </div>
    </AdminLayout>
  );
}
