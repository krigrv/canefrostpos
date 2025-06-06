import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  Mail as MailIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshIcon,
  Settings as SettingsIcon,
  Inbox as InboxIcon,
  Send as SentIcon,
  Trash2 as TrashIcon,
  Star as StarIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  AlertCircle as AlertIcon
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import ImapService from '../../services/imapService'

const Mail = () => {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    tls: true
  })

  useEffect(() => {
    loadSavedAccounts()
  }, [])

  const loadSavedAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('imapAccounts')
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts))
      }
    } catch (error) {
      console.error('Error loading saved accounts:', error)
    }
  }

  const saveAccounts = (accountsToSave) => {
    try {
      localStorage.setItem('imapAccounts', JSON.stringify(accountsToSave))
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.email || !newAccount.host || !newAccount.username || !newAccount.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Test connection first
      const imapService = new ImapService(newAccount)
      await imapService.testConnection()
      
      const accountWithId = {
        ...newAccount,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      const updatedAccounts = [...accounts, accountWithId]
      setAccounts(updatedAccounts)
      saveAccounts(updatedAccounts)
      
      setNewAccount({
        name: '',
        email: '',
        host: '',
        port: 993,
        username: '',
        password: '',
        tls: true
      })
      setShowAddAccount(false)
      
      toast({
        title: "Success",
        description: "Mail account added successfully"
      })
    } catch (error) {
      console.error('Error adding account:', error)
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to mail server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectAccount = async (account) => {
    setSelectedAccount(account)
    setEmails([])
    setSelectedEmail(null)
    await fetchEmails(account)
  }

  const fetchEmails = async (account) => {
    setLoading(true)
    try {
      const imapService = new ImapService(account)
      const fetchedEmails = await imapService.fetchEmails()
      setEmails(fetchedEmails)
    } catch (error) {
      console.error('Error fetching emails:', error)
      toast({
        title: "Error",
        description: "Failed to fetch emails",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshEmails = () => {
    if (selectedAccount) {
      fetchEmails(selectedAccount)
    }
  }

  const deleteAccount = (accountId) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId)
    setAccounts(updatedAccounts)
    saveAccounts(updatedAccounts)
    
    if (selectedAccount && selectedAccount.id === accountId) {
      setSelectedAccount(null)
      setEmails([])
      setSelectedEmail(null)
    }
    
    toast({
      title: "Success",
      description: "Mail account removed"
    })
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  const getCommonImapSettings = (email) => {
    const domain = email.split('@')[1]?.toLowerCase()
    
    const providers = {
      'gmail.com': { host: 'imap.gmail.com', port: 993 },
      'outlook.com': { host: 'outlook.office365.com', port: 993 },
      'hotmail.com': { host: 'outlook.office365.com', port: 993 },
      'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993 },
      'icloud.com': { host: 'imap.mail.me.com', port: 993 }
    }
    
    return providers[domain] || { host: '', port: 993 }
  }

  const handleEmailChange = (email) => {
    const settings = getCommonImapSettings(email)
    setNewAccount(prev => ({
      ...prev,
      email,
      host: settings.host,
      port: settings.port,
      username: email
    }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MailIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Mail Management</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshEmails}
            disabled={!selectedAccount || loading}
            variant="outline"
            size="sm"
          >
            <RefreshIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add IMAP Account</DialogTitle>
                <DialogDescription>
                  Add your email account to view messages in the POS system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    placeholder="My Work Email"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newAccount.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="host">IMAP Host</Label>
                    <Input
                      id="host"
                      placeholder="imap.gmail.com"
                      value={newAccount.host}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, host: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      value={newAccount.port}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Usually your email address"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your email password or app password"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tls"
                    checked={newAccount.tls}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, tls: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="tls">Use TLS/SSL (Recommended)</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddAccount(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addAccount}
                    disabled={loading}
                  >
                    {loading ? 'Testing...' : 'Add Account'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Accounts Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mail Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {accounts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MailIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No accounts added</p>
                  <p className="text-xs">Click "Add Account" to get started</p>
                </div>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedAccount?.id === account.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => selectAccount(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAccount(account.id)
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {selectedAccount ? `Inbox - ${selectedAccount.name}` : 'Select Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {!selectedAccount ? (
                <div className="p-4 text-center text-muted-foreground">
                  <InboxIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an account to view emails</p>
                </div>
              ) : loading ? (
                <div className="p-4 text-center">
                  <RefreshIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading emails...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <InboxIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No emails found</p>
                </div>
              ) : (
                emails.map((email, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedEmail === email ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{email.from}</p>
                        {email.flags?.includes('\\Seen') ? null : (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(email.date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {selectedEmail ? 'Email Content' : 'Select Email'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedEmail ? (
              <div className="text-center text-muted-foreground py-12">
                <MailIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an email to view its content</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{selectedEmail.subject}</h3>
                    {selectedEmail.flags?.includes('\\Seen') ? null : (
                      <Badge variant="secondary">Unread</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>From:</strong> {selectedEmail.from}</p>
                    <p><strong>Date:</strong> {formatDate(selectedEmail.date)}</p>
                  </div>
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                  <div className="prose prose-sm max-w-none">
                    {selectedEmail.text ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {selectedEmail.text}
                      </pre>
                    ) : selectedEmail.html ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                    ) : (
                      <p className="text-muted-foreground">No content available</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertIcon className="h-4 w-4" />
            Setup Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Common IMAP Settings:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Gmail: imap.gmail.com:993</li>
                <li>• Outlook: outlook.office365.com:993</li>
                <li>• Yahoo: imap.mail.yahoo.com:993</li>
                <li>• iCloud: imap.mail.me.com:993</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security Notes:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use app passwords for Gmail/Outlook</li>
                <li>• Enable IMAP in your email settings</li>
                <li>• Passwords are stored locally only</li>
                <li>• Always use TLS/SSL encryption</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Mail