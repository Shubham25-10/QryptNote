sed -i '/<div className="px-6 py-5 border-b border-hairline flex items-center justify-between">/i \
            {/* Notes History */}\
            <motion.div\
              initial={{ y: 20, opacity: 0 }}\
              animate={{ y: 0, opacity: 1 }}\
              transition={{ delay: 0.2 }}\
              className="bg-panel border border-hairline rounded-2xl overflow-hidden mb-8"\
            >\
              <div className="px-6 py-5 border-b border-hairline flex items-center justify-between">\
                <div className="flex items-center gap-2">\
                  <Shield className="w-5 h-5 text-violet" />\
                  <h3 className="text-lg font-medium text-text-primary">Created Notes</h3>\
                </div>\
              </div>\
              {loading ? (\
                <div className="p-12 flex justify-center">\
                  <div className="w-6 h-6 border-2 border-violet border-t-transparent rounded-full animate-spin" />\
                </div>\
              ) : error ? (\
                <div className="p-8 text-center text-red-400">\
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />\
                  <p className="text-sm">{error}</p>\
                </div>\
              ) : notes.length === 0 ? (\
                <div className="p-12 text-center">\
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">\
                    <Shield className="w-6 h-6" />\
                  </div>\
                  <h4 className="text-text-primary font-medium mb-1">No notes found</h4>\
                  <p className="text-sm text-text-muted max-w-sm mx-auto">\
                    You haven'\''t created any secure notes yet.\
                  </p>\
                </div>\
              ) : (\
                <div className="overflow-x-auto">\
                  <table className="w-full text-left text-sm whitespace-nowrap">\
                    <thead className="text-text-muted bg-white/5">\
                      <tr>\
                        <th className="px-6 py-4 font-medium">Date</th>\
                        <th className="px-6 py-4 font-medium">Link</th>\
                        <th className="px-6 py-4 font-medium">Views</th>\
                        <th className="px-6 py-4 font-medium">Status</th>\
                      </tr>\
                    </thead>\
                    <tbody className="divide-y divide-hairline">\
                      {notes.map((note) => (\
                        <tr key={note.id} className="hover:bg-white/[0.02] transition-colors">\
                          <td className="px-6 py-4 text-text-secondary">\
                            <div className="flex items-center gap-2">\
                              <Calendar className="w-4 h-4 opacity-50" />\
                              {new Date(note.createdAt).toLocaleDateString()}\
                            </div>\
                          </td>\
                          <td className="px-6 py-4 text-text-primary">\
                            <Link to={`/msg/${note.id}`} className="text-violet hover:underline truncate inline-block max-w-[200px]">\
                              {window.location.origin}/msg/{note.id}\
                            </Link>\
                          </td>\
                          <td className="px-6 py-4 text-text-primary font-medium">\
                            {note.viewCount} / {note.viewLimit}\
                          </td>\
                          <td className="px-6 py-4">\
                            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md w-fit ${note.viewCount >= note.viewLimit || (note.expiryTimestamp && Date.now() > note.expiryTimestamp) ? "bg-red-400/10 text-red-400" : "bg-green-400/10 text-green-400"}`}>\
                              <span className="capitalize">{note.viewCount >= note.viewLimit ? "Destroyed" : (note.expiryTimestamp && Date.now() > note.expiryTimestamp) ? "Expired" : "Active"}</span>\
                            </div>\
                          </td>\
                        </tr>\
                      ))}\
                    </tbody>\
                  </table>\
                </div>\
              )}\
            </motion.div>\
' src/pages/DashboardPage.tsx
