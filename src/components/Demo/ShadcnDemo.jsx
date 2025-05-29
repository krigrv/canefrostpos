import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useToast } from '../ui/use-toast'
import { CheckCircle, AlertCircle, ShoppingCart, Users, Package } from 'lucide-react'

const ShadcnDemo = () => {
  const [inputValue, setInputValue] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const [isSwitchOn, setIsSwitchOn] = useState(false)
  const [progress, setProgress] = useState(33)
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: "Success!",
      description: "This is a sample toast notification.",
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">shadcn/ui Components Demo</h1>
        <p className="text-muted-foreground">Showcasing the installed UI components for Canefrost POS</p>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sales
            </CardTitle>
            <CardDescription>Today's sales overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <Badge variant="secondary" className="mt-2">+12% from yesterday</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customers
            </CardTitle>
            <CardDescription>Active customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <Badge variant="outline" className="mt-2">+5 new today</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory
            </CardTitle>
            <CardDescription>Products in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <Badge variant="destructive" className="mt-2">12 low stock</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            System is running smoothly. All services are operational.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Warning: Some products are running low on stock.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>
            
            <TabsContent value="forms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Product Name</Label>
                  <Input
                    id="demo-input"
                    placeholder="Enter product name"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-select">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="food">Food & Beverages</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={showToast} className="w-full">
                Show Toast Notification
              </Button>
            </TabsContent>
            
            <TabsContent value="controls" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="demo-checkbox"
                  checked={isChecked}
                  onCheckedChange={setIsChecked}
                />
                <Label htmlFor="demo-checkbox">Enable notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="demo-switch"
                  checked={isSwitchOn}
                  onCheckedChange={setIsSwitchOn}
                />
                <Label htmlFor="demo-switch">Dark mode</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Progress: {progress}%</Label>
                <Progress value={progress} className="w-full" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    -10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    +10%
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="display" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Store Manager</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              
              <div className="flex gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ShadcnDemo